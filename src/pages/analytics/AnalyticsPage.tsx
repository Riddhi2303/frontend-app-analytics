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
  DEFAULT_SIDEBAR_FILTER_KEY,
  hasReadinessApiFilter,
  hasSidebarApiFilters,
  serializeApiFilters,
  type ReadinessFilter,
} from './data/api';

import AnalyticsFiltersRow from './components/AnalyticsFiltersRow';
import AnalyticsSidebar from './components/AnalyticsSidebar';
import AnalyticsTable from './components/AnalyticsTable';
import {
  buildCohortFiltersFromResidencies,
  buildNotAssignedFilter,
  buildStudentFilters,
  collectCourseCodes,
  mapStudentsFromApi,
} from './data/analyticsData';
import { DEFAULT_PAGE_SIZE, setApiFilters, setPage } from './data/slice';
import {
  fetchFilterCounts,
  fetchResidencyCounts,
  fetchResidencies,
  fetchStudentAnalytics,
  fetchTopFilterCounts,
} from './data/thunks';

import './analytics.scss';

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

const AnalyticsPage = () => {
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

  const [selectedSidebarFilter, setSelectedSidebarFilter] = useState(DEFAULT_SIDEBAR_FILTER_KEY);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedReadiness, setSelectedReadiness] = useState<ReadinessFilter>('all');

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchValue]);

  const sidebarCounts = filterCounts ?? EMPTY_COUNTS;

  /** Cohort residency ids from residencies API (do not wait for students list). */
  const cohortIdsByLabel = useMemo(() => {
    const map = new Map<string, number[]>();
    residencies.forEach((residency) => {
      if (residency.id > 0) {
        map.set(residency.name, [residency.id]);
      }
    });
    return map;
  }, [residencies]);

  const sidebarFilters = useMemo(() => buildSidebarApiFilters({
    selectedKey: selectedSidebarFilter,
    cohortIdsByLabel,
  }), [selectedSidebarFilter, cohortIdsByLabel]);

  const sidebarFilterKey = useMemo(
    () => serializeApiFilters(sidebarFilters),
    [sidebarFilters],
  );

  const studentFilters = useMemo(() => buildStudentFilters(sidebarCounts), [sidebarCounts]);
  const notAssignedFilter = useMemo(
    () => buildNotAssignedFilter(sidebarCounts),
    [sidebarCounts],
  );

  /** Cohort list renders when residencies load; counts update when facet API returns. */
  const cohortFilters = useMemo(
    () => buildCohortFiltersFromResidencies(residencies, residencyCounts),
    [residencies, residencyCounts],
  );

  const sidebarFilterActive = hasSidebarApiFilters(sidebarFilters);

  const readinessCounts = useMemo(() => {
    const partial = topFilterCounts ?? {
      all: 0,
      notReady: 0,
      ready: 0,
      inactive: 0,
    };

    if (!sidebarFilterActive) {
      const searchActive = Boolean(debouncedSearch.trim());
      return {
        all: searchActive
          ? (pagination.count ?? 0)
          : (filterCounts?.all ?? sidebarScopedStudentTotal ?? pagination.count ?? 0),
        notReady: partial.notReady,
        ready: partial.ready,
        inactive: partial.inactive,
      };
    }

    const searchActive = Boolean(debouncedSearch.trim());
    return {
      ...partial,
      all: searchActive
        ? (pagination.count ?? 0)
        : (sidebarScopedStudentTotal ?? 0),
    };
  }, [
    debouncedSearch,
    filterCounts,
    pagination.count,
    sidebarFilterActive,
    sidebarScopedStudentTotal,
    topFilterCounts,
  ]);

  const topChipCountsLoading = useMemo(() => {
    if (sidebarFilterActive) {
      const searchActive = Boolean(debouncedSearch.trim());
      const awaitingSidebarTotal = !searchActive
        && sidebarScopedStudentTotal == null
        && loading
        && !hasReadinessApiFilter(apiFilters);
      return {
        all: searchActive ? loading : awaitingSidebarTotal,
        notReady: topFilterCountsLoading.notReady,
        ready: topFilterCountsLoading.ready,
        inactive: topFilterCountsLoading.inactive,
      };
    }
    const searchActive = Boolean(debouncedSearch.trim());
    return {
      all: searchActive ? loading : filterCountsLoading,
      notReady: topFilterCountsLoading.notReady,
      ready: topFilterCountsLoading.ready,
      inactive: topFilterCountsLoading.inactive,
    };
  }, [
    apiFilters,
    debouncedSearch,
    filterCountsLoading,
    loading,
    sidebarFilterActive,
    sidebarScopedStudentTotal,
    topFilterCountsLoading,
  ]);

  const sidebarCountsLoading = filterCountsLoading || residencyCountsLoading;

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

  /** Sidebar + search scope for top chip `/counts/filters` calls (no readiness). */
  const topCountScopeFilters = useMemo(() => {
    const q = debouncedSearch.trim();
    return q ? { ...sidebarFilters, search: q } : sidebarFilters;
  }, [debouncedSearch, sidebarFilters]);

  const topCountsFetchKey = useMemo(
    () => serializeApiFilters(topCountScopeFilters),
    [topCountScopeFilters],
  );

  // ─── Residencies + left sidebar counts + top readiness counts ─────────────
  useEffect(() => {
    dispatch(fetchResidencies());
    dispatch(fetchFilterCounts());
    dispatch(fetchResidencyCounts());
  }, [dispatch]);

  useEffect(() => {
    if (lastFacetFetchKeyRef.current === topCountsFetchKey) {
      return;
    }
    lastFacetFetchKeyRef.current = topCountsFetchKey;
    dispatch(fetchTopFilterCounts(topCountScopeFilters));
  }, [dispatch, topCountScopeFilters, topCountsFetchKey]);

  // ─── Students table: sidebar + optional top readiness filter ─────────────────
  useEffect(() => {
    if (lastSyncedFilterKeyRef.current !== filterKey) {
      lastSyncedFilterKeyRef.current = filterKey;
      if (currentPage !== 1) {
        dispatch(setApiFilters(filters));
        dispatch(setPage(1));
        lastFetchKeyRef.current = null;
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

  const selectSidebarFilter = (filterKey: string) => {
    setSelectedSidebarFilter(filterKey);
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
    dispatch(fetchTopFilterCounts(scopeFilters));
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

  return (
    <main className="analytics-page">
      <section className="analytics-content">
        <AnalyticsSidebar
          studentFilters={studentFilters}
          notAssignedFilter={notAssignedFilter}
          cohortFilters={cohortFilters}
          selectedSidebarFilter={selectedSidebarFilter}
          onSelectSidebarFilter={selectSidebarFilter}
          countsLoading={sidebarCountsLoading}
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
            <AnalyticsTable students={students} courseCodes={courseCodes} loading={loading} />
          </div>
        </section>
      </section>
    </main>
  );
};

export default AnalyticsPage;
