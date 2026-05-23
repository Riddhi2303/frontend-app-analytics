/** Async action type strings (same pattern as frontend-app-mentor `data/thunks.js`). */

export const FETCH_STUDENT_ANALYTICS_REQUEST = 'analytics/FETCH_STUDENT_ANALYTICS_REQUEST';
export const FETCH_STUDENT_ANALYTICS_SUCCESS = 'analytics/FETCH_STUDENT_ANALYTICS_SUCCESS';
export const FETCH_STUDENT_ANALYTICS_FAILURE = 'analytics/FETCH_STUDENT_ANALYTICS_FAILURE';

export const FETCH_RESIDENCIES_REQUEST = 'analytics/FETCH_RESIDENCIES_REQUEST';
export const FETCH_RESIDENCIES_SUCCESS = 'analytics/FETCH_RESIDENCIES_SUCCESS';
export const FETCH_RESIDENCIES_FAILURE = 'analytics/FETCH_RESIDENCIES_FAILURE';

/** Left sidebar enrollment counts from `/counts/filters`. */
export const FETCH_FILTER_COUNTS_REQUEST = 'analytics/FETCH_FILTER_COUNTS_REQUEST';
export const FETCH_FILTER_COUNTS_SUCCESS = 'analytics/FETCH_FILTER_COUNTS_SUCCESS';
export const FETCH_FILTER_COUNTS_FAILURE = 'analytics/FETCH_FILTER_COUNTS_FAILURE';

/** Left sidebar cohort counts from `/counts/residencies/`. */
export const FETCH_RESIDENCY_COUNTS_REQUEST = 'analytics/FETCH_RESIDENCY_COUNTS_REQUEST';
export const FETCH_RESIDENCY_COUNTS_SUCCESS = 'analytics/FETCH_RESIDENCY_COUNTS_SUCCESS';
export const FETCH_RESIDENCY_COUNTS_FAILURE = 'analytics/FETCH_RESIDENCY_COUNTS_FAILURE';

/** Top readiness chip totals via scoped `/counts/filters` calls. */
export const FETCH_FACET_COUNTS_REQUEST = 'analytics/FETCH_FACET_COUNTS_REQUEST';
export const FETCH_FACET_COUNTS_PARTIAL_SUCCESS = 'analytics/FETCH_FACET_COUNTS_PARTIAL_SUCCESS';
export const FETCH_FACET_COUNTS_SUCCESS = 'analytics/FETCH_FACET_COUNTS_SUCCESS';
export const FETCH_FACET_COUNTS_FAILURE = 'analytics/FETCH_FACET_COUNTS_FAILURE';
