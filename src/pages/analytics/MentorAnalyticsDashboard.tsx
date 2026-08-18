import {
  useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '@edx/frontend-platform/react';
import { Spinner } from '@openedx/paragon';

import type { AppDispatch, RootState } from '../../store';
import {
  applyReadinessApiFilter,
  buildSidebarApiFilters,
  canAssignResidency,
  fetchResidencyCountsApi,
  fetchScopedCountsApi,
  hasSidebarApiFilters,
  isAllStudentsSidebarKey,
  serializeApiFilters,
  SIDEBAR_FILTER_KEY,
  type MyRolesResponse,
  type ReadinessFilter,
  type SidebarIsSelection,
} from './data/api';

import AnalyticsFiltersRow from './components/AnalyticsFiltersRow';
import AnalyticsSidebar from './components/AnalyticsSidebar';
import AnalyticsTable from './components/AnalyticsTable';
import AnalyticsTopNav from './components/AnalyticsTopNav';
import StudentDetailDrawer from './components/StudentDetailDrawer';
import {
  buildCohortFiltersFromResidencies,
  buildNotAssignedFilter,
  buildReadinessCounts,
  buildSeasonCountsFromApi,
  buildStudentFilters,
  buildYearCountsFromApi,
  collectCourseCodes,
  DEFAULT_IS_SEASON,
  DEFAULT_IS_YEAR,
  mapStudentsFromApi,
  type ApiStudentAnalyticsResponse,
  type IsSeasonOption,
  type IsYearOption,
} from './data/analyticsData';
import { DEFAULT_PAGE_SIZE, setApiFilters, setPage } from './data/slice';
import {
  fetchFilterCounts,
  fetchResidencyCounts,
  fetchResidencies,
  fetchStudentAnalytics,
  fetchTopFilterCounts,
} from './data/thunks';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_COUNTS = {
  all: 0,
  is_innovation_school: 0,
  is_ngo_student: 0,
  is_maker_skill: 0,
  residency_not_assigned: 0,
  residency_assigned: 0,
  not_ready_for_residency: 0,
  ready_for_residency: 0,
  inactive_for_two_weeks: 0,
  per_residency: {} as Record<string, number>,
  per_year: {} as Record<string, number>,
  per_season: {} as Record<string, number>,
};

type AppContextShape = {
  authenticatedUser: Record<string, unknown> | null;
  config: Record<string, unknown>;
};

type MentorAnalyticsDashboardProps = {
  roles: MyRolesResponse | null;
};

const MentorAnalyticsDashboard = ({ roles }: MentorAnalyticsDashboardProps) => {
  const { authenticatedUser } = useContext(AppContext) as AppContextShape;
  const dispatch = useDispatch<AppDispatch>();

  const filterCounts = useSelector((state: RootState) => state.analyticsReducer.filterCounts);
  const filterCountsLoading = useSelector(
    (state: RootState) => state.analyticsReducer.filterCountsLoading,
  );
  const residencyCounts = useSelector((state: RootState) => state.analyticsReducer.residencyCounts);
  const residencyCountsLoading = useSelector(
    (state: RootState) => state.analyticsReducer.residencyCountsLoading,
  );
  const scopedFilterCounts = useSelector(
    (state: RootState) => state.analyticsReducer.scopedFilterCounts,
  );
  const scopedFilterCountsLoading = useSelector(
    (state: RootState) => state.analyticsReducer.scopedFilterCountsLoading,
  );
  const apiCounts = useSelector((state: RootState) => state.analyticsReducer.counts);
  const topFilterCounts = useSelector((state: RootState) => state.analyticsReducer.topFilterCounts);
  const topFilterCountsLoading = useSelector(
    (state: RootState) => state.analyticsReducer.topFilterCountsLoading,
  );
  const studentAnalyticsResults = useSelector((state: RootState) => state.analyticsReducer.studentAnalyticsResults);
  const pagination = useSelector((state: RootState) => state.analyticsReducer.studentAnalyticsPagination);
  const sidebarScopedStudentTotal = useSelector(
    (state: RootState) => state.analyticsReducer.sidebarScopedStudentTotal,
  );
  const apiFilters = useSelector((state: RootState) => state.analyticsReducer.apiFilters);
  const residencies = useSelector((state: RootState) => state.analyticsReducer.residencies);
  const loading = useSelector((state: RootState) => state.analyticsReducer.loading);
  const error = useSelector((state: RootState) => state.analyticsReducer.error);

  const lastFetchKeyRef = useRef<string | null>(null);
  const lastFacetFetchKeyRef = useRef<string | null>(null);
  const lastSyncedFilterKeyRef = useRef<string | null>(null);
  /** Which sidebar control last changed. `null` = first page load (no sidebar click yet). */
  const lastSidebarCountScopeRef = useRef<'enrollment' | 'year' | 'season' | 'cohort' | null>(null);

  const currentPage = pagination.page;

  /** Enrollment Type — null when IS Year/Season/Cohort filters are active. */
  const [enrollmentKey, setEnrollmentKey] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<IsYearOption | null>(DEFAULT_IS_YEAR);
  const [selectedSeason, setSelectedSeason] = useState<IsSeasonOption | null>(DEFAULT_IS_SEASON);
  const [selectedCohort, setSelectedCohort] = useState<number | 'not-assigned' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedReadiness, setSelectedReadiness] = useState<ReadinessFilter>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);
  /**
   * Immediate per-row count loaders (set on click / first load) so the spinner shows
   * before the scoped Redux request flips to loading.
   */
  const [pendingEnrollmentLoader, setPendingEnrollmentLoader] = useState<string | null>(null);
  const [pendingYearLoader, setPendingYearLoader] = useState<IsYearOption | null>(null);
  /** Single season row loader (season click). */
  const [pendingSeasonLoader, setPendingSeasonLoader] = useState<IsSeasonOption | null>(null);
  /**
   * All season rows loading — year change reseeds every season from `?year=` / `?year=&season=`.
   * First load uses `initialSeasonCountsLoading` (`?year=2026`) instead.
   */
  const [pendingSeasonListLoader, setPendingSeasonListLoader] = useState(false);
  /**
   * All Students refresh: reload unfiltered `/counts/filters/` and spin every
   * enrollment + year row until it returns.
   */
  const [pendingGlobalCountsLoader, setPendingGlobalCountsLoader] = useState(false);
  const [pendingCohortLoader, setPendingCohortLoader] = useState<number | 'not-assigned' | null>(null);
  /** Clear cohort / season change / first load: spin every cohort row while `/residencies/` reloads. */
  const [pendingCohortListLoader, setPendingCohortListLoader] = useState(true);
  const [selectedCohortResidencyCounts, setSelectedCohortResidencyCounts] = useState<{
    id: number;
    total: number;
    ready: number;
  } | null>(null);
  /**
   * First-load season totals from `/counts/filters/?year=2026` (not the year+season scoped call).
   */
  const [initialYearScopedCounts, setInitialYearScopedCounts] = useState<
    ApiStudentAnalyticsResponse['counts'] | null
  >(null);
  const [initialSeasonCountsLoading, setInitialSeasonCountsLoading] = useState(true);
  /** Last year row count refreshed from a year-scoped `/counts/filters/?year=…` response. */
  const patchedYearCountRef = useRef<{ year: IsYearOption; count: number } | null>(null);
  /** Per-season counts last refreshed from `?year=…&season=summer|winter|not_assigned`. */
  const patchedSeasonCountsRef = useRef<Partial<Record<IsSeasonOption, number>>>({});
  /**
   * After a year change, ignore in-memory scoped counts until the new
   * `/counts/filters/?year=…` request completes — otherwise seasons keep the old year.
   */
  const allowScopedSeasonApplyRef = useRef(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchValue]);

  /**
   * Page-load counts only:
   * year → unfiltered `/counts/filters/`
   * season → `/counts/filters/?year=2026`
   * cohort → `/counts/filters/?year=2026&season=winter` (existing scoped fetch)
   */
  useEffect(() => {
    let cancelled = false;
    const year = Number(DEFAULT_IS_YEAR);
    if (!Number.isFinite(year)) {
      setInitialSeasonCountsLoading(false);
      return undefined;
    }

    setInitialSeasonCountsLoading(true);
    fetchScopedCountsApi({ year }).then((counts) => {
      if (cancelled) {
        return;
      }
      setInitialYearScopedCounts(counts);
      patchedSeasonCountsRef.current = buildSeasonCountsFromApi(counts);
      setInitialSeasonCountsLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setInitialSeasonCountsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isSelection = useMemo<SidebarIsSelection>(() => ({
    year: selectedYear,
    season: selectedSeason,
    cohort: selectedCohort,
  }), [selectedCohort, selectedSeason, selectedYear]);

  const sidebarFilters = useMemo(() => buildSidebarApiFilters({
    enrollmentKey,
    isSelection,
  }), [enrollmentKey, isSelection]);

  /**
   * Season + cohort counts only follow year/season scope — not Enrollment Type.
   * Cohort selection only patches the selected cohort row (same idea as Enrollment Type).
   */
  const isScopedCountsScope = hasSidebarApiFilters(sidebarFilters);
  const isYearSeasonOnlyScope = enrollmentKey == null
    && selectedCohort == null
    && (selectedYear != null || selectedSeason != null);
  const sidebarCounts = filterCounts ?? EMPTY_COUNTS;

  /** Snapshot year+season scoped counts so cohort filter does not wipe other cohort/season rows. */
  const yearSeasonScopedCountsRef = useRef<ApiStudentAnalyticsResponse['counts'] | null>(null);
  useEffect(() => {
    if (enrollmentKey != null || selectedCohort != null) {
      return;
    }
    if (selectedYear == null && selectedSeason == null) {
      yearSeasonScopedCountsRef.current = null;
      return;
    }
    if (scopedFilterCounts) {
      yearSeasonScopedCountsRef.current = scopedFilterCounts;
    }
  }, [enrollmentKey, selectedCohort, selectedYear, selectedSeason, scopedFilterCounts]);

  const yearSeasonBaseCounts = (
    (isYearSeasonOnlyScope && allowScopedSeasonApplyRef.current
      ? scopedFilterCounts
      : null)
    ?? yearSeasonScopedCountsRef.current
  );

  const cohortCountData = useMemo(() => {
    const base = residencyCounts ?? apiCounts;
    if (
      selectedCohortResidencyCounts == null
      || !base
    ) {
      return base;
    }

    const residency = residencies.find((item) => item.id === selectedCohortResidencyCounts.id);
    const nameKey = residency?.name;
    return {
      ...base,
      per_residency: {
        ...(base.per_residency ?? {}),
        ...(nameKey ? { [nameKey]: selectedCohortResidencyCounts.total } : {}),
        [String(selectedCohortResidencyCounts.id)]: selectedCohortResidencyCounts.total,
      },
      per_residency_ready: {
        ...(base.per_residency_ready ?? {}),
        ...(nameKey ? { [nameKey]: selectedCohortResidencyCounts.ready } : {}),
        [String(selectedCohortResidencyCounts.id)]: selectedCohortResidencyCounts.ready,
      },
    };
  }, [apiCounts, residencies, residencyCounts, selectedCohortResidencyCounts]);

  const cohortCountsReady = Boolean(
    residencies.length > 0
    || cohortCountData?.per_residency,
  );

  const scopedLoading = Boolean(isScopedCountsScope && scopedFilterCountsLoading);

  /** Enrollment list counts stay on unfiltered `/counts/filters/`; selected row can refresh from scoped. */
  const enrollmentCountsReady = filterCounts != null;
  /** First load / All Students: spin every enrollment row until global counts arrive. */
  const enrollmentListLoading = Boolean(
    filterCounts == null || filterCountsLoading || pendingGlobalCountsLoader,
  );
  /** First load / All Students: spin every year row until global counts arrive. */
  const initialYearCountsLoading = Boolean(
    filterCounts == null || filterCountsLoading || pendingGlobalCountsLoader,
  );

  const yearSeasonCountsReady = Boolean(
    enrollmentKey != null
      ? (filterCounts?.per_season != null || filterCounts != null)
      : (selectedYear != null || selectedSeason != null)
        ? (yearSeasonBaseCounts != null || yearSeasonScopedCountsRef.current != null)
        : (filterCounts?.per_season != null || filterCounts != null),
  );
  /**
   * All season rows: year change, or first load from `?year=2026`.
   * Single season row: season click via `loadingSeason`.
   */
  const seasonListLoading = Boolean(
    pendingSeasonListLoader
    || (lastSidebarCountScopeRef.current == null && initialSeasonCountsLoading)
    || (
      !yearSeasonCountsReady
      && enrollmentKey == null
      && selectedCohort == null
      && selectedYear != null
      && selectedSeason == null
    ),
  );

  // Clear pending row loaders only after a scoped request finishes (not on initial idle).
  const wasScopedLoadingRef = useRef(false);
  useEffect(() => {
    if (scopedFilterCountsLoading) {
      wasScopedLoadingRef.current = true;
      // New scoped request started — safe to apply its result to season rows.
      allowScopedSeasonApplyRef.current = true;
      return;
    }
    if (!wasScopedLoadingRef.current) {
      return;
    }
    wasScopedLoadingRef.current = false;
    setPendingEnrollmentLoader(null);
    setPendingYearLoader(null);
    setPendingSeasonLoader(null);
    setPendingSeasonListLoader(false);
    if (lastSidebarCountScopeRef.current === 'cohort') {
      setPendingCohortLoader((current) => (current === 'not-assigned' ? null : current));
    }
  }, [scopedFilterCountsLoading]);

  const wasResidencyCountsLoadingRef = useRef(false);
  useEffect(() => {
    if (residencyCountsLoading) {
      wasResidencyCountsLoadingRef.current = true;
      return;
    }
    if (!wasResidencyCountsLoadingRef.current) {
      return;
    }
    wasResidencyCountsLoadingRef.current = false;
    setPendingCohortListLoader(false);
  }, [residencyCountsLoading]);

  // Clear All Students / global count loaders after unfiltered `/counts/filters/` finishes.
  const wasFilterCountsLoadingRef = useRef(false);
  useEffect(() => {
    if (filterCountsLoading) {
      wasFilterCountsLoadingRef.current = true;
      return;
    }
    if (!wasFilterCountsLoadingRef.current) {
      return;
    }
    wasFilterCountsLoadingRef.current = false;
    setPendingGlobalCountsLoader(false);
  }, [filterCountsLoading]);

  /**
   * Non–All Students enrollment with empty API filters should not leave a stuck row loader.
   */
  useEffect(() => {
    if (!pendingEnrollmentLoader) {
      return;
    }
    if (isAllStudentsSidebarKey(enrollmentKey) || !isScopedCountsScope) {
      setPendingEnrollmentLoader(null);
    }
  }, [enrollmentKey, isScopedCountsScope, pendingEnrollmentLoader]);

  /** Per-row loaders — pending (immediate) or in-flight scoped request. */
  const loadingEnrollmentKey = (
    isAllStudentsSidebarKey(enrollmentKey) || pendingGlobalCountsLoader
      ? null
      : (pendingEnrollmentLoader
        ?? ((scopedLoading && enrollmentKey) ? enrollmentKey : null))
  );
  /** Year row loader when `/counts/filters/?year=…` is in flight for that year. */
  const loadingYear = (
    enrollmentKey != null || pendingGlobalCountsLoader
      ? null
      : (pendingYearLoader
        ?? ((scopedLoading && selectedYear != null && lastSidebarCountScopeRef.current === 'year')
          ? selectedYear
          : null))
  );
  const loadingSeason = (
    enrollmentKey != null || selectedCohort != null || pendingSeasonListLoader
      ? null
      : (pendingSeasonLoader
        ?? ((scopedLoading
          && lastSidebarCountScopeRef.current === 'season'
          && selectedSeason != null
          && sidebarFilters.season != null)
          ? selectedSeason
          : null))
  );
  const loadingCohort = (
    enrollmentKey != null
      ? null
      : pendingCohortLoader
  );
  /** Year / season / clear-cohort: spin every cohort row until `/residencies/` counts arrive. */
  const cohortListLoading = Boolean(
    enrollmentKey == null
    && !loadingCohort
    && selectedSeason != null
    && selectedSeason !== 'not-assigned'
    && (pendingCohortListLoader || residencyCountsLoading),
  );

  const studentFilters = useMemo(() => {
    const base = buildStudentFilters(sidebarCounts);
    // All Students / empty scope: keep global filterCounts — do not apply stale year/season scoped totals.
    if (!enrollmentKey || isAllStudentsSidebarKey(enrollmentKey) || !scopedFilterCounts) {
      return base;
    }
    return base.map((item) => {
      const filterKey = SIDEBAR_FILTER_KEY.student(item.label);
      if (filterKey !== enrollmentKey) {
        return item;
      }
      let count = item.count;
      if (item.label === 'Innovation School') {
        count = scopedFilterCounts.is_innovation_school;
      } else if (item.label === 'IS Fellowship') {
        count = scopedFilterCounts.is_ngo_student;
      } else if (item.label === 'Maker Skills') {
        count = scopedFilterCounts.is_maker_skill;
      }
      return { ...item, count };
    });
  }, [sidebarCounts, enrollmentKey, scopedFilterCounts]);

  const notAssignedFilter = useMemo(() => {
    const base = yearSeasonBaseCounts ?? sidebarCounts;
    if (selectedCohort === 'not-assigned' && scopedFilterCounts) {
      return buildNotAssignedFilter({
        ...base,
        residency_not_assigned: scopedFilterCounts.residency_not_assigned,
      });
    }
    return buildNotAssignedFilter(base);
  }, [scopedFilterCounts, selectedCohort, sidebarCounts, yearSeasonBaseCounts]);

  /** Cohort list for selected year + season; counts update when facet API returns. */
  const cohortFilters = useMemo(
    () => buildCohortFiltersFromResidencies(
      residencies,
      cohortCountData,
      [],
      selectedYear,
      selectedSeason,
    ),
    [cohortCountData, residencies, selectedSeason, selectedYear],
  );

  const yearCounts = useMemo(() => {
    const base = buildYearCountsFromApi(filterCounts);
    if (enrollmentKey != null || selectedYear == null) {
      patchedYearCountRef.current = null;
      return base;
    }

    const next = { ...base };
    if (patchedYearCountRef.current?.year === selectedYear) {
      next[selectedYear] = patchedYearCountRef.current.count;
    }

    // First load: keep year totals from unfiltered `/counts/filters/`.
    if (lastSidebarCountScopeRef.current == null) {
      return next;
    }

    // Refresh the selected year from year-scoped `/counts/filters/?year=…` (not season/cohort-only).
    if (scopedFilterCounts && lastSidebarCountScopeRef.current === 'year') {
      const count = selectedYear === 'not-assigned'
        ? (scopedFilterCounts.per_year?.unassigned
          ?? scopedFilterCounts.residency_not_assigned
          ?? scopedFilterCounts.all)
        : (scopedFilterCounts.per_year?.[selectedYear] ?? scopedFilterCounts.all);
      patchedYearCountRef.current = { year: selectedYear, count };
      next[selectedYear] = count;
    }

    return next;
  }, [enrollmentKey, filterCounts, scopedFilterCounts, selectedYear]);

  const seasonCounts = useMemo(() => {
    const globalBase = buildSeasonCountsFromApi(filterCounts);
    if (enrollmentKey != null) {
      patchedSeasonCountsRef.current = {};
      allowScopedSeasonApplyRef.current = false;
      return globalBase;
    }

    const next = { ...globalBase };
    (Object.keys(patchedSeasonCountsRef.current) as IsSeasonOption[]).forEach((season) => {
      const patched = patchedSeasonCountsRef.current[season];
      if (patched != null) {
        next[season] = patched;
      }
    });

    // First load: season totals from `/counts/filters/?year=2026` only.
    if (lastSidebarCountScopeRef.current == null) {
      if (initialYearScopedCounts) {
        const fromYearOnly = buildSeasonCountsFromApi(initialYearScopedCounts);
        patchedSeasonCountsRef.current = {
          summer: fromYearOnly.summer,
          winter: fromYearOnly.winter,
          'not-assigned': fromYearOnly['not-assigned'],
        };
        return fromYearOnly;
      }
      return next;
    }

    if (selectedCohort != null || lastSidebarCountScopeRef.current === 'cohort') {
      return next;
    }

    // Wait for the in-flight year/season scoped response (do not reuse previous year's counts).
    if (!scopedFilterCounts || scopedFilterCountsLoading || !allowScopedSeasonApplyRef.current) {
      return next;
    }

    /**
     * Year-only `?year=2026` (no season): reseed every season from `per_season`.
     * Year + season / season click: seed all on year change; otherwise patch selected only.
     */
    const yearOnlyScope = sidebarFilters.year != null && sidebarFilters.season == null;

    if (yearOnlyScope) {
      const fromScoped = buildSeasonCountsFromApi(scopedFilterCounts);
      patchedSeasonCountsRef.current = {
        summer: fromScoped.summer,
        winter: fromScoped.winter,
        'not-assigned': fromScoped['not-assigned'],
      };
      return fromScoped;
    }

    if (selectedSeason == null || sidebarFilters.season == null) {
      return next;
    }

    const selectedCount = selectedSeason === 'not-assigned'
      ? (scopedFilterCounts.per_season?.unassigned ?? scopedFilterCounts.all)
      : (scopedFilterCounts.per_season?.[selectedSeason] ?? scopedFilterCounts.all);

    const seedAllSeasons = pendingSeasonListLoader
      || lastSidebarCountScopeRef.current === 'year'
      || Object.keys(patchedSeasonCountsRef.current).length === 0;

    if (seedAllSeasons) {
      const fromScoped = buildSeasonCountsFromApi(scopedFilterCounts);
      fromScoped[selectedSeason] = selectedCount;
      patchedSeasonCountsRef.current = {
        summer: fromScoped.summer,
        winter: fromScoped.winter,
        'not-assigned': fromScoped['not-assigned'],
      };
      return fromScoped;
    }

    patchedSeasonCountsRef.current = {
      ...patchedSeasonCountsRef.current,
      [selectedSeason]: selectedCount,
    };
    next[selectedSeason] = selectedCount;
    return next;
  }, [
    enrollmentKey,
    filterCounts,
    initialYearScopedCounts,
    pendingSeasonListLoader,
    scopedFilterCounts,
    scopedFilterCountsLoading,
    selectedCohort,
    selectedSeason,
    selectedYear,
    sidebarFilters.season,
    sidebarFilters.year,
  ]);

  /** Left-sidebar scoped `/counts/filters` — never include search. */
  const topCountScopeFilters = sidebarFilters;

  const topCountsFetchKey = useMemo(
    () => serializeApiFilters(topCountScopeFilters),
    [topCountScopeFilters],
  );

  const sidebarFilterActive = hasSidebarApiFilters(sidebarFilters);
  const isGlobalTopCountScope = topCountsFetchKey === '{}';

  const readinessCounts = useMemo(() => {
    const globalTopCounts = filterCounts ? buildReadinessCounts(filterCounts) : null;
    // Global / All Students: prefer unfiltered filterCounts — ignore stale year/season scoped chips.
    const partial = (isGlobalTopCountScope
      ? (globalTopCounts ?? topFilterCounts)
      : topFilterCounts) ?? {
      all: 0,
      notReady: 0,
      ready: 0,
      inactive: 0,
    };

    const searchActive = Boolean(debouncedSearch.trim());

    if (!sidebarFilterActive) {
      return {
        all: searchActive
          ? (pagination.count ?? 0)
          : (filterCounts?.all ?? partial.all ?? 0),
        notReady: partial.notReady,
        ready: partial.ready,
        inactive: partial.inactive,
      };
    }

    return {
      ...partial,
      all: searchActive
        ? (pagination.count ?? 0)
        : (sidebarScopedStudentTotal ?? partial.all ?? 0),
    };
  }, [
    debouncedSearch,
    filterCounts,
    isGlobalTopCountScope,
    pagination.count,
    sidebarFilterActive,
    sidebarScopedStudentTotal,
    topFilterCounts,
  ]);

  const topChipCountsLoading = useMemo(() => {
    const searchActive = Boolean(debouncedSearch.trim());
    const globalCountsLoading = filterCountsLoading;
    const scopedCountsLoading = topFilterCountsLoading;

    if (sidebarFilterActive) {
      return {
        all: searchActive ? loading : scopedCountsLoading.all,
        notReady: scopedCountsLoading.notReady,
        ready: scopedCountsLoading.ready,
        inactive: scopedCountsLoading.inactive,
      };
    }

    if (isGlobalTopCountScope) {
      const chipLoading = searchActive ? loading : globalCountsLoading;
      return {
        all: chipLoading,
        notReady: globalCountsLoading,
        ready: globalCountsLoading,
        inactive: globalCountsLoading,
      };
    }

    return {
      all: searchActive ? loading : scopedCountsLoading.all,
      notReady: scopedCountsLoading.notReady,
      ready: scopedCountsLoading.ready,
      inactive: scopedCountsLoading.inactive,
    };
  }, [
    debouncedSearch,
    filterCountsLoading,
    isGlobalTopCountScope,
    loading,
    sidebarFilterActive,
    topFilterCountsLoading,
  ]);

  const topChipCountsHasValue = useMemo(() => {
    const searchActive = Boolean(debouncedSearch.trim());
    const hasScopedCounts = isGlobalTopCountScope
      ? filterCounts != null
      : topFilterCounts != null;

    return {
      all: searchActive
        ? pagination.count != null
        : (filterCounts != null || topFilterCounts != null || sidebarScopedStudentTotal != null),
      notReady: hasScopedCounts,
      ready: hasScopedCounts,
      inactive: hasScopedCounts,
    };
  }, [
    debouncedSearch,
    filterCounts,
    isGlobalTopCountScope,
    pagination.count,
    sidebarScopedStudentTotal,
    topFilterCounts,
  ]);

  const analyticsUserKey = useMemo(() => {
    if (!authenticatedUser || typeof authenticatedUser !== 'object') { return ''; }
    const u = authenticatedUser as Record<string, unknown>;
    const id = u.userId ?? u.user_id ?? u.username ?? u.email;
    return id != null ? String(id) : '';
  }, [authenticatedUser]);

  const filters = useMemo(() => {
    const base = applyReadinessApiFilter(sidebarFilters, selectedReadiness);
    const q = debouncedSearch.trim();
    if (!q) {
      return base;
    }
    return { ...base, search: q };
  }, [debouncedSearch, sidebarFilters, selectedReadiness]);

  const filterKey = useMemo(() => serializeApiFilters(filters), [filters]);

  // ─── Residencies + left sidebar counts + top readiness counts ─────────────
  useEffect(() => {
    dispatch(fetchResidencies());
    dispatch(fetchFilterCounts());
  }, [dispatch]);

  /** Cohort counts from `/counts/residencies/?year=&season=` (same filters as `/counts/filters/`). */
  const residencyCountFilters = useMemo(() => {
    if (enrollmentKey != null) {
      return null;
    }
    if (selectedYear !== '2026' && selectedYear !== '2027') {
      return null;
    }
    if (selectedSeason !== 'summer' && selectedSeason !== 'winter') {
      return null;
    }
    return {
      year: Number(selectedYear),
      season: selectedSeason,
    };
  }, [enrollmentKey, selectedSeason, selectedYear]);

  const residencyCountFetchKey = residencyCountFilters
    ? serializeApiFilters(residencyCountFilters)
    : '';

  useEffect(() => {
    if (!residencyCountFilters) {
      return;
    }
    dispatch(fetchResidencyCounts(residencyCountFilters));
  }, [dispatch, residencyCountFetchKey, residencyCountFilters]);

  /** Selected cohort: refresh that row from `/counts/residencies/?residency=`. */
  useEffect(() => {
    if (typeof selectedCohort !== 'number') {
      setSelectedCohortResidencyCounts(null);
      if (selectedCohort == null) {
        setPendingCohortLoader(null);
      }
      return undefined;
    }

    const residency = residencies.find((item) => item.id === selectedCohort);
    let cancelled = false;
    fetchResidencyCountsApi({ residency: selectedCohort }).then((counts) => {
      if (cancelled) {
        return;
      }
      const total = (residency && counts.per_residency?.[residency.name])
        ?? counts.per_residency?.[String(selectedCohort)]
        ?? counts.residency_assigned
        ?? counts.all
        ?? 0;
      const ready = (residency && counts.per_residency_ready?.[residency.name])
        ?? counts.per_residency_ready?.[String(selectedCohort)]
        ?? counts.ready_for_residency
        ?? 0;
      setSelectedCohortResidencyCounts({ id: selectedCohort, total, ready });
      setPendingCohortLoader(null);
    }).catch(() => {
      if (!cancelled) {
        setPendingCohortLoader(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [residencies, selectedCohort]);

  useEffect(() => {
    if (isGlobalTopCountScope) {
      return;
    }
    if (lastFacetFetchKeyRef.current === topCountsFetchKey) {
      return;
    }
    lastFacetFetchKeyRef.current = topCountsFetchKey;
    dispatch(fetchTopFilterCounts(topCountScopeFilters));
  }, [dispatch, isGlobalTopCountScope, topCountScopeFilters, topCountsFetchKey]);

  // ─── Students table: sidebar + optional top readiness filter ─────────────────
  useEffect(() => {
    if (lastSyncedFilterKeyRef.current !== filterKey) {
      lastSyncedFilterKeyRef.current = filterKey;
      lastFetchKeyRef.current = null;
      if (currentPage !== 1) {
        dispatch(setApiFilters(filters));
        dispatch(setPage(1));
        return;
      }
      if (serializeApiFilters(apiFilters) !== filterKey) {
        dispatch(setApiFilters(filters));
      }
    }

    const fetchKey = `${analyticsUserKey}|${currentPage}|${PAGE_SIZE}|${filterKey}`;
    if (lastFetchKeyRef.current === fetchKey) {
      return;
    }
    lastFetchKeyRef.current = fetchKey;

    dispatch(fetchStudentAnalytics({ page: currentPage, pageSize: PAGE_SIZE, filters }));
  }, [analyticsUserKey, apiFilters, currentPage, dispatch, filterKey, filters]);

  const students = useMemo(() => mapStudentsFromApi(studentAnalyticsResults), [studentAnalyticsResults]);
  const courseCodes = useMemo(() => collectCourseCodes(studentAnalyticsResults), [studentAnalyticsResults]);
  const selectedStudent = useMemo(
    () => studentAnalyticsResults.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, studentAnalyticsResults],
  );

  useEffect(() => {
    if (selectedStudentId == null) {
      return;
    }
    const stillVisible = studentAnalyticsResults.some((student) => student.id === selectedStudentId);
    if (!stillVisible) {
      setSelectedStudentId(null);
      setSelectedCourseCode(null);
    }
  }, [selectedStudentId, studentAnalyticsResults]);

  useEffect(() => {
    if (selectedCohort == null || selectedCohort === 'not-assigned') {
      return;
    }
    const stillVisible = cohortFilters.some((item) => item.id === selectedCohort);
    if (!stillVisible) {
      setSelectedCohort(null);
    }
  }, [cohortFilters, selectedCohort]);

  const clearSidebarSearch = () => {
    setSearchValue('');
    setDebouncedSearch('');
  };

  const selectEnrollment = (nextFilterKey: string) => {
    lastSidebarCountScopeRef.current = 'enrollment';
    clearSidebarSearch();
    setPendingYearLoader(null);
    setPendingSeasonLoader(null);
    setPendingSeasonListLoader(false);
    setPendingCohortLoader(null);
    setPendingCohortListLoader(false);
    patchedYearCountRef.current = null;
    patchedSeasonCountsRef.current = {};
    allowScopedSeasonApplyRef.current = false;

    if (isAllStudentsSidebarKey(nextFilterKey)) {
      // Unfiltered `/counts/filters/` — refresh every enrollment + year count.
      setPendingEnrollmentLoader(null);
      setPendingGlobalCountsLoader(true);
      dispatch(fetchFilterCounts());
    } else {
      setPendingGlobalCountsLoader(false);
      setPendingEnrollmentLoader(nextFilterKey);
    }

    setEnrollmentKey(nextFilterKey);
    setSelectedYear(null);
    setSelectedSeason(null);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const selectYear = (year: IsYearOption) => {
    lastSidebarCountScopeRef.current = 'year';
    clearSidebarSearch();
    setPendingEnrollmentLoader(null);
    setPendingGlobalCountsLoader(false);
    setPendingYearLoader(year);
    setPendingSeasonLoader(null);
    // Year change reseeds all seasons from `?year=&season=` — loader on every season row.
    setPendingSeasonListLoader(year !== 'not-assigned');
    setPendingCohortLoader(null);
    setPendingCohortListLoader(
      year !== 'not-assigned'
      && selectedSeason != null
      && selectedSeason !== 'not-assigned',
    );
    // Drop prior year season totals; wait for the new scoped response.
    patchedSeasonCountsRef.current = {};
    allowScopedSeasonApplyRef.current = false;
    setEnrollmentKey(null);
    setSelectedYear(year);
    if (year === 'not-assigned') {
      setSelectedSeason(null);
      setSelectedCohort(null);
    } else {
      // Keep current season as-is (including null after Clear). Only 2026+winter is the initial page default.
      setSelectedCohort(null);
    }
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const selectSeason = (season: IsSeasonOption) => {
    lastSidebarCountScopeRef.current = 'season';
    clearSidebarSearch();
    setPendingEnrollmentLoader(null);
    setPendingGlobalCountsLoader(false);
    setPendingYearLoader(null);
    setPendingSeasonListLoader(false);
    setPendingSeasonLoader(season);
    setPendingCohortLoader(null);
    setPendingCohortListLoader(season !== 'not-assigned');
    setEnrollmentKey(null);
    setSelectedSeason(season);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const selectCohort = (cohort: number | 'not-assigned') => {
    lastSidebarCountScopeRef.current = 'cohort';
    clearSidebarSearch();
    setPendingEnrollmentLoader(null);
    setPendingYearLoader(null);
    setPendingSeasonLoader(null);
    setPendingSeasonListLoader(false);
    setPendingCohortListLoader(false);
    setPendingCohortLoader(cohort);
    setEnrollmentKey(null);
    setSelectedCohort(cohort);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const clearSeason = () => {
    // Clearing season → `?year=…` — refresh year row and all season counts from per_season.
    lastSidebarCountScopeRef.current = selectedYear != null ? 'year' : 'season';
    clearSidebarSearch();
    setPendingEnrollmentLoader(null);
    setPendingYearLoader(selectedYear);
    setPendingSeasonLoader(null);
    setPendingSeasonListLoader(selectedYear != null && selectedYear !== 'not-assigned');
    setPendingCohortLoader(null);
    setPendingCohortListLoader(false);
    patchedSeasonCountsRef.current = {};
    allowScopedSeasonApplyRef.current = false;
    setEnrollmentKey(null);
    setSelectedSeason(null);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const clearCohort = () => {
    lastSidebarCountScopeRef.current = 'cohort';
    clearSidebarSearch();
    setPendingEnrollmentLoader(null);
    setPendingGlobalCountsLoader(false);
    setPendingYearLoader(null);
    setPendingSeasonLoader(null);
    setPendingSeasonListLoader(false);
    setPendingCohortLoader(null);
    const reloadCohortList = selectedSeason != null && selectedSeason !== 'not-assigned'
      && (selectedYear === '2026' || selectedYear === '2027');
    setPendingCohortListLoader(reloadCohortList);
    setEnrollmentKey(null);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
    if (reloadCohortList) {
      dispatch(fetchResidencyCounts({
        year: Number(selectedYear),
        season: selectedSeason as 'summer' | 'winter',
      }));
    }
  };

  const refreshAnalytics = useCallback(() => {
    const q = searchValue.trim();
    setDebouncedSearch(q);

    const activeFilters = (() => {
      const base = applyReadinessApiFilter(sidebarFilters, selectedReadiness);
      return q ? { ...base, search: q } : base;
    })();

    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
    lastSyncedFilterKeyRef.current = null;

    dispatch(setApiFilters(activeFilters));
    dispatch(fetchFilterCounts());
    if (residencyCountFilters) {
      dispatch(fetchResidencyCounts(residencyCountFilters));
    }
    if (serializeApiFilters(sidebarFilters) !== '{}') {
      dispatch(fetchTopFilterCounts(sidebarFilters));
    }
    dispatch(fetchStudentAnalytics({
      page: currentPage,
      pageSize: PAGE_SIZE,
      filters: activeFilters,
    }));
  }, [
    currentPage,
    dispatch,
    residencyCountFilters,
    searchValue,
    selectedReadiness,
    sidebarFilters,
  ]);

  const showAssignResidency = roles ? canAssignResidency(roles) : false;

  return (
    <main className="analytics-page">
      <AnalyticsTopNav />
      <section className="analytics-content">
        <AnalyticsSidebar
          studentFilters={studentFilters}
          notAssignedFilter={notAssignedFilter}
          cohortFilters={cohortFilters}
          enrollmentKey={enrollmentKey}
          selectedYear={selectedYear}
          selectedSeason={selectedSeason}
          selectedCohort={selectedCohort}
          yearCounts={yearCounts}
          seasonCounts={seasonCounts}
          onSelectEnrollment={selectEnrollment}
          onSelectYear={selectYear}
          onSelectSeason={selectSeason}
          onSelectCohort={selectCohort}
          onClearSeason={clearSeason}
          onClearCohort={clearCohort}
          enrollmentCountsReady={enrollmentCountsReady}
          enrollmentListLoading={enrollmentListLoading}
          yearCountsLoading={initialYearCountsLoading}
          yearCountsReady={filterCounts != null}
          yearSeasonCountsReady={yearSeasonCountsReady}
          seasonListLoading={seasonListLoading}
          cohortCountsReady={cohortCountsReady}
          cohortListLoading={cohortListLoading}
          loadingEnrollmentKey={loadingEnrollmentKey}
          loadingYear={loadingYear}
          loadingSeason={loadingSeason}
          loadingCohort={loadingCohort}
        />
        <section className="analytics-main">
          <AnalyticsFiltersRow
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onRefresh={refreshAnalytics}
            selectedReadiness={selectedReadiness}
            onReadinessChange={setSelectedReadiness}
            counts={readinessCounts}
            countsLoading={topChipCountsLoading}
            countsHasValue={topChipCountsHasValue}
            pagination={{
              currentPage,
              totalPages: Math.max(pagination.totalPages || 1, 1),
              pageSize: PAGE_SIZE,
              totalCount: pagination.count || 0,
            }}
            onPageChange={(page) => dispatch(setPage(page))}
          />
          <div className="analytics-table-area">
            {loading && (
              <div className="analytics-table-loading-overlay" aria-busy="true" aria-live="polite">
                <Spinner animation="border" screenReaderText="Loading students" />
              </div>
            )}
            {error && (
              <div className="analytics-table-error" role="alert">
                {error}
              </div>
            )}
            <AnalyticsTable
              students={students}
              courseCodes={courseCodes}
              loading={loading}
              selectedStudentId={selectedStudentId}
              canAssignResidency={showAssignResidency}
              onStudentSelect={(studentId, courseCode) => {
                if (selectedStudentId === studentId && !courseCode) {
                  setSelectedStudentId(null);
                  setSelectedCourseCode(null);
                  return;
                }
                setSelectedStudentId(studentId);
                setSelectedCourseCode(courseCode ?? null);
              }}
            />
            {selectedStudent && (
              <StudentDetailDrawer
                student={selectedStudent}
                initialCourseCode={selectedCourseCode}
                onClose={() => {
                  setSelectedStudentId(null);
                  setSelectedCourseCode(null);
                }}
              />
            )}
          </div>
        </section>
      </section>
    </main>
  );
};

export default MentorAnalyticsDashboard;
