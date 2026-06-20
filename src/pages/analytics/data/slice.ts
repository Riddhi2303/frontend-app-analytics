import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  FETCH_FACET_COUNTS_FAILURE,
  FETCH_FACET_COUNTS_PARTIAL_SUCCESS,
  FETCH_FACET_COUNTS_REQUEST,
  FETCH_FACET_COUNTS_SUCCESS,
  FETCH_FILTER_COUNTS_FAILURE,
  FETCH_FILTER_COUNTS_REQUEST,
  FETCH_FILTER_COUNTS_SUCCESS,
  FETCH_RESIDENCY_COUNTS_FAILURE,
  FETCH_RESIDENCY_COUNTS_REQUEST,
  FETCH_RESIDENCY_COUNTS_SUCCESS,
  FETCH_RESIDENCIES_FAILURE,
  FETCH_RESIDENCIES_REQUEST,
  FETCH_RESIDENCIES_SUCCESS,
  FETCH_STUDENT_ANALYTICS_FAILURE,
  FETCH_STUDENT_ANALYTICS_REQUEST,
  FETCH_STUDENT_ANALYTICS_SUCCESS,
} from './actionTypes';
import type { ApiFilters } from './api';
import { hasReadinessApiFilter } from './api';
import type {
  ApiResidency,
  ApiStudent,
  ApiStudentAnalyticsResponse,
  TopFilterCounts,
  TopFilterCountsLoading,
  TopFilterCountsPartialPayload,
} from './analyticsData';
import { initialTopFilterCountsLoading } from './analyticsData';

export type { ApiFilters };

export type StudentAnalyticsPaginationState = {
  count: number;
  next: string | null;
  previous: string | null;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
};

export type AnalyticsState = {
  courseId: string | null;
  loading: boolean;
  error: string | null;
  studentAnalyticsResults: ApiStudent[];
  counts: ApiStudentAnalyticsResponse['counts'] | null;
  /** Left sidebar enrollment badges (`/counts/filters`). */
  filterCounts: ApiStudentAnalyticsResponse['counts'] | null;
  filterCountsLoading: boolean;
  filterCountsError: string | null;
  /** Left sidebar cohort badges (`/counts/residencies/`). */
  residencyCounts: ApiStudentAnalyticsResponse['counts'] | null;
  residencyCountsLoading: boolean;
  residencyCountsError: string | null;
  /** Top readiness chips — each total from pagination.total_count. */
  topFilterCounts: TopFilterCounts | null;
  topFilterCountsLoading: TopFilterCountsLoading;
  topFilterCountsError: string | null;
  studentAnalyticsPagination: StudentAnalyticsPaginationState;
  /** `pagination.total_count` from the latest students fetch with sidebar filters only (no readiness). */
  sidebarScopedStudentTotal: number | null;
  apiFilters: ApiFilters;
  residencies: ApiResidency[];
  residenciesLoading: boolean;
  residenciesError: string | null;
};

export const DEFAULT_PAGE_SIZE = 30;

const emptyPagination = (): StudentAnalyticsPaginationState => ({
  count: 0,
  next: null,
  previous: null,
  limit: DEFAULT_PAGE_SIZE,
  offset: 0,
  page: 1,
  totalPages: 1,
});

const applyStudentAnalyticsPayload = (
  state: AnalyticsState,
  payload: ApiStudentAnalyticsResponse,
) => {
  const { results, pagination, counts } = payload;
  const {
    page, page_size: pageSize, total_count: totalCount, total_pages: totalPages,
  } = pagination;

  state.studentAnalyticsResults = results;
  state.counts = counts;
  state.studentAnalyticsPagination = {
    count: totalCount,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    page,
    totalPages,
    next: page < totalPages ? 'next' : null,
    previous: page > 1 ? 'previous' : null,
  };
};

const initialState: AnalyticsState = {
  courseId: null,
  loading: false,
  error: null,
  studentAnalyticsResults: [],
  counts: null,
  filterCounts: null,
  filterCountsLoading: false,
  filterCountsError: null,
  residencyCounts: null,
  residencyCountsLoading: false,
  residencyCountsError: null,
  topFilterCounts: null,
  topFilterCountsLoading: initialTopFilterCountsLoading(),
  topFilterCountsError: null,
  studentAnalyticsPagination: emptyPagination(),
  sidebarScopedStudentTotal: null,
  apiFilters: {},
  residencies: [],
  residenciesLoading: false,
  residenciesError: null,
};

const slice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setCourseId: (state, action: PayloadAction<string | null>) => {
      state.courseId = action.payload;
    },
    setStudentAnalyticsPagination: (
      state,
      action: PayloadAction<Partial<StudentAnalyticsPaginationState>>,
    ) => {
      state.studentAnalyticsPagination = { ...state.studentAnalyticsPagination, ...action.payload };
    },
    setPage: (state, action: PayloadAction<number>) => {
      const page = action.payload;
      const { limit } = state.studentAnalyticsPagination;
      state.studentAnalyticsPagination.page = page;
      state.studentAnalyticsPagination.offset = (page - 1) * limit;
    },
    setApiFilters: (state, action: PayloadAction<ApiFilters>) => {
      state.apiFilters = action.payload;
      state.studentAnalyticsPagination.page = 1;
      state.studentAnalyticsPagination.offset = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === FETCH_STUDENT_ANALYTICS_REQUEST,
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action): action is { type: typeof FETCH_STUDENT_ANALYTICS_SUCCESS; payload: ApiStudentAnalyticsResponse } => (
          action.type === FETCH_STUDENT_ANALYTICS_SUCCESS
        ),
        (state, action) => {
          state.loading = false;
          state.error = null;
          applyStudentAnalyticsPayload(state, action.payload);
          const searchActive = Boolean(state.apiFilters.search?.trim());
          if (!hasReadinessApiFilter(state.apiFilters) && !searchActive) {
            state.sidebarScopedStudentTotal = action.payload.pagination.total_count;
          }
        },
      )
      .addMatcher(
        (action): action is { type: typeof FETCH_STUDENT_ANALYTICS_FAILURE; payload: string } => (
          action.type === FETCH_STUDENT_ANALYTICS_FAILURE
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
          state.studentAnalyticsResults = [];
          state.counts = null;
          state.studentAnalyticsPagination = emptyPagination();
        },
      )
      .addMatcher(
        (action) => action.type === FETCH_FACET_COUNTS_REQUEST,
        (state) => {
          state.topFilterCountsLoading = {
            all: true,
            notReady: true,
            ready: true,
            inactive: true,
          };
          state.topFilterCountsError = null;
        },
      )
      .addMatcher(
        (action): action is {
          type: typeof FETCH_FACET_COUNTS_SUCCESS;
          payload: TopFilterCounts;
        } => action.type === FETCH_FACET_COUNTS_SUCCESS,
        (state, action) => {
          state.topFilterCounts = action.payload;
          state.topFilterCountsLoading = initialTopFilterCountsLoading();
          state.topFilterCountsError = null;
        },
      )
      .addMatcher(
        (action): action is {
          type: typeof FETCH_FACET_COUNTS_PARTIAL_SUCCESS;
          payload: TopFilterCountsPartialPayload;
        } => action.type === FETCH_FACET_COUNTS_PARTIAL_SUCCESS,
        (state, action) => {
          const { key, totalCount } = action.payload;
          if (!state.topFilterCounts) {
            state.topFilterCounts = { all: 0, notReady: 0, ready: 0, inactive: 0 };
          }
          state.topFilterCounts[key] = totalCount;
          state.topFilterCountsLoading[key] = false;
        },
      )
      .addMatcher(
        (action) => action.type === FETCH_FILTER_COUNTS_REQUEST,
        (state) => {
          state.filterCountsLoading = true;
          state.filterCountsError = null;
        },
      )
      .addMatcher(
        (action): action is {
          type: typeof FETCH_FILTER_COUNTS_SUCCESS;
          payload: ApiStudentAnalyticsResponse['counts'];
        } => action.type === FETCH_FILTER_COUNTS_SUCCESS,
        (state, action) => {
          state.filterCountsLoading = false;
          state.filterCountsError = null;
          state.filterCounts = action.payload;
        },
      )
      .addMatcher(
        (action): action is { type: typeof FETCH_FILTER_COUNTS_FAILURE; payload: string } => (
          action.type === FETCH_FILTER_COUNTS_FAILURE
        ),
        (state, action) => {
          state.filterCountsLoading = false;
          state.filterCountsError = action.payload;
        },
      )
      .addMatcher(
        (action): action is { type: typeof FETCH_FACET_COUNTS_FAILURE; payload: string } => (
          action.type === FETCH_FACET_COUNTS_FAILURE
        ),
        (state, action) => {
          state.topFilterCountsLoading = initialTopFilterCountsLoading();
          state.topFilterCountsError = action.payload;
        },
      )
      .addMatcher(
        (action) => action.type === FETCH_RESIDENCY_COUNTS_REQUEST,
        (state) => {
          state.residencyCountsLoading = true;
          state.residencyCountsError = null;
        },
      )
      .addMatcher(
        (action): action is {
          type: typeof FETCH_RESIDENCY_COUNTS_SUCCESS;
          payload: ApiStudentAnalyticsResponse['counts'];
        } => action.type === FETCH_RESIDENCY_COUNTS_SUCCESS,
        (state, action) => {
          state.residencyCountsLoading = false;
          state.residencyCountsError = null;
          state.residencyCounts = action.payload;
        },
      )
      .addMatcher(
        (action): action is { type: typeof FETCH_RESIDENCY_COUNTS_FAILURE; payload: string } => (
          action.type === FETCH_RESIDENCY_COUNTS_FAILURE
        ),
        (state, action) => {
          state.residencyCountsLoading = false;
          state.residencyCountsError = action.payload;
        },
      )
      .addMatcher(
        (action) => action.type === FETCH_RESIDENCIES_REQUEST,
        (state) => {
          state.residenciesLoading = true;
          state.residenciesError = null;
        },
      )
      .addMatcher(
        (action): action is { type: typeof FETCH_RESIDENCIES_SUCCESS; payload: ApiResidency[] } => (
          action.type === FETCH_RESIDENCIES_SUCCESS
        ),
        (state, action) => {
          state.residenciesLoading = false;
          state.residenciesError = null;
          state.residencies = action.payload;
        },
      )
      .addMatcher(
        (action): action is { type: typeof FETCH_RESIDENCIES_FAILURE; payload: string } => (
          action.type === FETCH_RESIDENCIES_FAILURE
        ),
        (state, action) => {
          state.residenciesLoading = false;
          state.residenciesError = action.payload;
          // Non-critical: keep previous residencies like the old thunk (empty on first load is ok)
        },
      );
  },
});

export const {
  setCourseId,
  setStudentAnalyticsPagination,
  setPage,
  setApiFilters,
} = slice.actions;

export const { reducer } = slice;
