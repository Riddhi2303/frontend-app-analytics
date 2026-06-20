import type { AppDispatch } from '../../../store';

import {
  fetchEnrollmentFilterCountsApi,
  fetchResidencyCountsApi,
  fetchResidenciesApi,
  fetchScopedCountsApi,
  fetchStudentsAnalyticsApi,
} from './api';
import type { ApiFilters } from './api';
import { serializeApiFilters } from './api';
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

export {
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

export const GLOBAL_TOP_COUNTS_KEY = '__global__';

let latestStudentAnalyticsRequestId = 0;

const inflightRequests = new Map<string, Promise<unknown>>();

/** Collapse concurrent identical requests (e.g. React Strict Mode double-mount). */
function dedupeInflight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const promise = factory().finally(() => {
    if (inflightRequests.get(key) === promise) {
      inflightRequests.delete(key);
    }
  });
  inflightRequests.set(key, promise);
  return promise;
}

/**
 * One scoped `/counts/filters` call returns all readiness totals for the active sidebar + search scope.
 */
export const fetchTopFilterCounts = (scopeFilters: ApiFilters = {}) => async (
  dispatch: AppDispatch,
) => {
  const scopeKey = serializeApiFilters(scopeFilters);

  return dedupeInflight(`top-filter-counts:${scopeKey}`, async () => {
    dispatch({ type: FETCH_FACET_COUNTS_REQUEST });

    try {
      const counts = await fetchScopedCountsApi(scopeFilters);
      dispatch({
        type: FETCH_FACET_COUNTS_SUCCESS,
        payload: {
          all: counts.all,
          notReady: counts.not_ready_for_residency,
          ready: counts.ready_for_residency,
          inactive: counts.inactive_for_two_weeks,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load filter counts.';
      dispatch({
        type: FETCH_FACET_COUNTS_FAILURE,
        payload: message,
      });
    }
  });
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
  latestStudentAnalyticsRequestId += 1;
  const requestId = latestStudentAnalyticsRequestId;

  dispatch({ type: FETCH_STUDENT_ANALYTICS_REQUEST, payload: { requestId } });
  try {
    const data = await fetchStudentsAnalyticsApi({ page, pageSize, filters });
    if (requestId !== latestStudentAnalyticsRequestId) {
      return;
    }
    dispatch({
      type: FETCH_STUDENT_ANALYTICS_SUCCESS,
      payload: data,
    });
  } catch (error: unknown) {
    if (requestId !== latestStudentAnalyticsRequestId) {
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to load student analytics.';
    dispatch({
      type: FETCH_STUDENT_ANALYTICS_FAILURE,
      payload: message,
    });
  }
};

/** Left sidebar enrollment counts (`/counts/filters`). */
export const fetchFilterCounts = () => async (dispatch: AppDispatch) => dedupeInflight(
  'filter-counts',
  async () => {
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
  },
);

/** Left sidebar cohort counts (`/counts/residencies/`). */
export const fetchResidencyCounts = () => async (dispatch: AppDispatch) => dedupeInflight(
  'residency-counts',
  async () => {
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
  },
);

export const fetchResidencies = () => async (dispatch: AppDispatch) => dedupeInflight(
  'residencies',
  async () => {
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
  },
);
