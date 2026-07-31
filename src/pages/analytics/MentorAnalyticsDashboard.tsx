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
  hasSidebarApiFilters,
  serializeApiFilters,
  type MyRolesResponse,
  type ReadinessFilter,
  type SidebarIsSelection,
} from './data/api';

import AnalyticsFiltersRow from './components/AnalyticsFiltersRow';
import AnalyticsSidebar from './components/AnalyticsSidebar';
import AnalyticsTable from './components/AnalyticsTable';
import StudentDetailDrawer from './components/StudentDetailDrawer';
import {
  buildCohortFiltersFromResidencies,
  buildNotAssignedFilter,
  buildReadinessCounts,
  buildStudentFilters,
  collectCourseCodes,
  DEFAULT_IS_SEASON,
  DEFAULT_IS_YEAR,
  filterResidenciesByYearSeason,
  mapStudentsFromApi,
  sumResidencyCountsForSeason,
  sumResidencyCountsForYear,
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

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchValue]);

  const sidebarCounts = filterCounts ?? EMPTY_COUNTS;
  const cohortCountData = residencyCounts ?? apiCounts;
  const cohortCountsReady = Boolean(cohortCountData?.per_residency);
  const enrollmentCountsLoading = filterCountsLoading;
  /** Only show cohort spinner while the dedicated residency-counts request is in flight. */
  const cohortCountsLoading = residencies.length > 0
    && !cohortCountsReady
    && residencyCountsLoading;

  const enrollmentCountsReady = filterCounts != null;

  const matchingResidencies = useMemo(
    () => filterResidenciesByYearSeason(residencies, selectedYear, selectedSeason),
    [residencies, selectedSeason, selectedYear],
  );

  const matchingResidencyIds = useMemo(
    () => matchingResidencies.map((residency) => residency.id).filter((id) => id > 0),
    [matchingResidencies],
  );

  const isSelection = useMemo<SidebarIsSelection>(() => ({
    year: selectedYear,
    season: selectedSeason,
    cohort: selectedCohort,
  }), [selectedCohort, selectedSeason, selectedYear]);

  const sidebarFilters = useMemo(() => buildSidebarApiFilters({
    enrollmentKey,
    isSelection,
    matchingResidencyIds,
  }), [enrollmentKey, isSelection, matchingResidencyIds]);

  const studentFilters = useMemo(() => buildStudentFilters(sidebarCounts), [sidebarCounts]);
  const notAssignedFilter = useMemo(
    () => buildNotAssignedFilter(sidebarCounts),
    [sidebarCounts],
  );

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

  const yearCounts = useMemo(() => ({
    '2026': sumResidencyCountsForYear(residencies, '2026', cohortCountData),
    '2027': sumResidencyCountsForYear(residencies, '2027', cohortCountData),
    'not-assigned': sidebarCounts.residency_not_assigned,
  }), [cohortCountData, residencies, sidebarCounts.residency_not_assigned]);

  const seasonCounts = useMemo(() => {
    const year = selectedYear === '2026' || selectedYear === '2027' ? selectedYear : '2026';
    return {
      summer: sumResidencyCountsForSeason(residencies, year, 'summer', cohortCountData),
      winter: sumResidencyCountsForSeason(residencies, year, 'winter', cohortCountData),
      'not-assigned': sidebarCounts.residency_not_assigned,
    };
  }, [cohortCountData, residencies, selectedYear, sidebarCounts.residency_not_assigned]);

  /** Sidebar + search scope for top chip `/counts/filters` calls (no readiness). */
  const topCountScopeFilters = useMemo(() => {
    const q = debouncedSearch.trim();
    return q ? { ...sidebarFilters, search: q } : sidebarFilters;
  }, [debouncedSearch, sidebarFilters]);

  const topCountsFetchKey = useMemo(
    () => serializeApiFilters(topCountScopeFilters),
    [topCountScopeFilters],
  );

  const sidebarFilterActive = hasSidebarApiFilters(sidebarFilters);
  const isGlobalTopCountScope = topCountsFetchKey === '{}';

  const readinessCounts = useMemo(() => {
    const globalTopCounts = filterCounts ? buildReadinessCounts(filterCounts) : null;
    const partial = (isGlobalTopCountScope
      ? (topFilterCounts ?? globalTopCounts)
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
          : (partial.all || filterCounts?.all || sidebarScopedStudentTotal || pagination.count || 0),
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
    dispatch(fetchResidencyCounts());
  }, [dispatch]);

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

  const selectEnrollment = (nextFilterKey: string) => {
    setEnrollmentKey(nextFilterKey);
    setSelectedYear(null);
    setSelectedSeason(null);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const selectYear = (year: IsYearOption) => {
    setEnrollmentKey(null);
    setSelectedYear(year);
    if (year === 'not-assigned') {
      setSelectedSeason(null);
      setSelectedCohort(null);
    } else if (selectedSeason === 'not-assigned' || selectedSeason == null) {
      setSelectedSeason(DEFAULT_IS_SEASON);
      setSelectedCohort(null);
    } else {
      setSelectedCohort(null);
    }
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const selectSeason = (season: IsSeasonOption) => {
    setEnrollmentKey(null);
    setSelectedSeason(season);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const selectCohort = (cohort: number | 'not-assigned') => {
    setEnrollmentKey(null);
    setSelectedCohort(cohort);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const clearSeason = () => {
    setEnrollmentKey(null);
    setSelectedSeason(null);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
  };

  const clearCohort = () => {
    setEnrollmentKey(null);
    setSelectedCohort(null);
    setSelectedReadiness('all');
    lastFetchKeyRef.current = null;
    lastFacetFetchKeyRef.current = null;
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
    dispatch(fetchResidencyCounts());
    const scopeFilters = q ? { ...sidebarFilters, search: q } : sidebarFilters;
    if (serializeApiFilters(scopeFilters) !== '{}') {
      dispatch(fetchTopFilterCounts(scopeFilters));
    }
    dispatch(fetchStudentAnalytics({
      page: currentPage,
      pageSize: PAGE_SIZE,
      filters: activeFilters,
    }));
  }, [
    currentPage,
    dispatch,
    searchValue,
    selectedReadiness,
    sidebarFilters,
  ]);

  const showAssignResidency = roles ? canAssignResidency(roles) : false;

  return (
    <main className="analytics-page">
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
          enrollmentCountsLoading={enrollmentCountsLoading}
          enrollmentCountsReady={enrollmentCountsReady}
          cohortCountsLoading={cohortCountsLoading}
          cohortCountsReady={cohortCountsReady}
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
