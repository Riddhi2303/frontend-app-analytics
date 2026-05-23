import type { AppDispatch } from '../../../store';

import {
  fetchEnrollmentFilterCountsApi,
  fetchResidencyCountsApi,
  fetchResidenciesApi,
  fetchScopedFilterCountsApi,
  fetchStudentsAnalyticsApi,
} from './api';
import type { ApiFilters } from './api';
import type { TopReadinessCountKey } from './analyticsData';
import {
  FETCH_FACET_COUNTS_FAILURE,
  FETCH_FACET_COUNTS_PARTIAL_SUCCESS,
  FETCH_FACET_COUNTS_REQUEST,
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

export {
  FETCH_FACET_COUNTS_FAILURE,
  FETCH_FACET_COUNTS_PARTIAL_SUCCESS,
  FETCH_FACET_COUNTS_REQUEST,
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

export const GLOBAL_TOP_COUNTS_KEY = '__global__';

const READINESS_COUNT_REQUESTS: Array<{
  key: TopReadinessCountKey;
  buildFilters: (scopeFilters: ApiFilters) => ApiFilters;
}> = [
  {
    key: 'notReady',
    buildFilters: (scopeFilters) => ({ ...scopeFilters, is_residence_ready: false }),
  },
  {
    key: 'ready',
    buildFilters: (scopeFilters) => ({ ...scopeFilters, is_residence_ready: true }),
  },
  {
    key: 'inactive',
    buildFilters: (scopeFilters) => ({ ...scopeFilters, inactive_for_two_weeks: true }),
  },
];

/**
 * Three parallel `/counts/filters` readiness calls; each top chip updates when its request finishes.
 * Scope includes left-sidebar filters and optional `search` (e.g. `?search=shivam&is_residence_ready=true`).
 */
export const fetchTopFilterCounts = (scopeFilters: ApiFilters = {}) => async (
  dispatch: AppDispatch,
) => {
  dispatch({ type: FETCH_FACET_COUNTS_REQUEST });

  const results = await Promise.allSettled(
    READINESS_COUNT_REQUESTS.map(async ({ key, buildFilters }) => {
      const totalCount = await fetchScopedFilterCountsApi(buildFilters(scopeFilters));
      dispatch({
        type: FETCH_FACET_COUNTS_PARTIAL_SUCCESS,
        payload: {
          key,
          totalCount,
        },
      });
    }),
  );

  const failed = results.find((result) => result.status === 'rejected');
  if (failed?.status === 'rejected') {
    const reason = failed.reason;
    const message = reason instanceof Error ? reason.message : 'Failed to load filter counts.';
    dispatch({
      type: FETCH_FACET_COUNTS_FAILURE,
      payload: message,
    });
  }
};

/** @alias fetchTopFilterCounts */
export const fetchFacetCounts = fetchTopFilterCounts;

/** Table rows + pagination; sidebar + optional top readiness filter. */
export const fetchStudentAnalytics = ({
  page,
  pageSize,
  filters = {},
}: {
  page: number;
  pageSize: number;
  filters?: ApiFilters;
}) => async (dispatch: AppDispatch) => {
  dispatch({ type: FETCH_STUDENT_ANALYTICS_REQUEST });
  try {
    const data = await fetchStudentsAnalyticsApi({ page, pageSize, filters });
    dispatch({
      type: FETCH_STUDENT_ANALYTICS_SUCCESS,
      payload: data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load student analytics.';
    dispatch({
      type: FETCH_STUDENT_ANALYTICS_FAILURE,
      payload: message,
    });
  }
};

/** Left sidebar enrollment counts (`/counts/filters`). */
export const fetchFilterCounts = () => async (dispatch: AppDispatch) => {
  dispatch({ type: FETCH_FILTER_COUNTS_REQUEST });
  try {
    const counts = await fetchEnrollmentFilterCountsApi();
    dispatch({
      type: FETCH_FILTER_COUNTS_SUCCESS,
      payload: counts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load filter counts.';
    dispatch({
      type: FETCH_FILTER_COUNTS_FAILURE,
      payload: message,
    });
  }
};

/** Left sidebar cohort counts (`/counts/residencies/`). */
export const fetchResidencyCounts = () => async (dispatch: AppDispatch) => {
  dispatch({ type: FETCH_RESIDENCY_COUNTS_REQUEST });
  try {
    const counts = await fetchResidencyCountsApi();
    dispatch({
      type: FETCH_RESIDENCY_COUNTS_SUCCESS,
      payload: counts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load residency counts.';
    dispatch({
      type: FETCH_RESIDENCY_COUNTS_FAILURE,
      payload: message,
    });
  }
};

export const fetchResidencies = () => async (dispatch: AppDispatch) => {
  dispatch({ type: FETCH_RESIDENCIES_REQUEST });
  try {
    const data = await fetchResidenciesApi();
    dispatch({
      type: FETCH_RESIDENCIES_SUCCESS,
      payload: data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load residencies.';
    dispatch({
      type: FETCH_RESIDENCIES_FAILURE,
      payload: message,
    });
  }
};
