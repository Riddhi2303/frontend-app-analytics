import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";

import type {
  ApiResidency,
  ApiStudentAnalyticsResponse,
} from "./analyticsData";

export type ApiFilters = {
  is_ngo?: boolean;
  is_innovation_school?: boolean;
  is_maker_skill?: boolean;
  residency_assigned?: boolean;
  residency?: number;
  is_residence_ready?: boolean;
  inactive_for_two_weeks?: boolean;
  search?: string;
};

export type ReadinessFilter = "all" | "not-ready" | "ready" | "inactive";

export const SIDEBAR_FILTER_KEY = {
  student: (label: string) => `student:${label}`,
  residency: (label: string) => `residency:${label}`,
  cohort: (label: string) => `cohort:${label}`,
};

export const DEFAULT_SIDEBAR_FILTER_KEY =
  SIDEBAR_FILTER_KEY.student("All Students");

/** True when a left-sidebar option other than "All Students" is active. */
export const hasSidebarApiFilters = (filters: ApiFilters): boolean =>
  Object.keys(filters).length > 0;

export type SidebarFilterSelection = {
  selectedKey: string;
  cohortIdsByLabel: Map<string, number[]>;
};

/** Normalize cohort/residency ids: positive integers, unique, sorted. */
export const normalizeResidencyIds = (input: unknown): number[] | undefined => {
  if (input == null) {
    return undefined;
  }

  const raw = Array.isArray(input) ? input : String(input).split(",");
  const ids = raw
    .map((value) =>
      typeof value === "number"
        ? value
        : Number.parseInt(String(value).trim(), 10),
    )
    .filter((id) => Number.isFinite(id) && id > 0);

  const unique = [...new Set(ids)].sort((a, b) => a - b);
  return unique.length > 0 ? unique : undefined;
};

export const buildSidebarApiFilters = ({
  selectedKey,
  cohortIdsByLabel,
}: SidebarFilterSelection): ApiFilters => {
  const filters: ApiFilters = {};

  if (selectedKey.startsWith("student:")) {
    const label = selectedKey.slice("student:".length);
    if (label === "Innovation School") {
      filters.is_innovation_school = true;
    }
    if (label === "IS Fellowship") {
      filters.is_ngo = true;
    }
    if (label === "Maker Skills") {
      filters.is_maker_skill = true;
    }
    return filters;
  }

  if (selectedKey.startsWith("residency:")) {
    const label = selectedKey.slice("residency:".length);
    if (label === "Not Assigned") {
      filters.residency_assigned = false;
    }
    return filters;
  }

  if (selectedKey.startsWith("cohort:")) {
    const label = selectedKey.slice("cohort:".length);
    const residencyIds = normalizeResidencyIds(cohortIdsByLabel.get(label));
    const [residencyId] = residencyIds ?? [];
    if (residencyId) {
      filters.residency = residencyId;
    }
  }

  return filters;
};

export const applyReadinessApiFilter = (
  filters: ApiFilters,
  readiness: ReadinessFilter,
): ApiFilters => {
  const next: ApiFilters = { ...filters };

  if (readiness === "ready") {
    next.is_residence_ready = true;
  }
  if (readiness === "not-ready") {
    next.is_residence_ready = false;
  }
  if (readiness === "inactive") {
    next.inactive_for_two_weeks = true;
  }

  return next;
};

export const hasReadinessApiFilter = (filters: ApiFilters): boolean =>
  filters.is_residence_ready !== undefined ||
  filters.inactive_for_two_weeks === true;

export const stripReadinessApiFilter = (filters: ApiFilters): ApiFilters => {
  const next = { ...filters };
  delete next.is_residence_ready;
  delete next.inactive_for_two_weeks;
  return next;
};

const isAllStudentsSidebarKey = (selectedKey: string) =>
  selectedKey === DEFAULT_SIDEBAR_FILTER_KEY ||
  selectedKey === SIDEBAR_FILTER_KEY.student("All Students");

/** Total students in scope for the active left-sidebar filter (matches sidebar radio count). */
export const resolveSidebarSelectionTotal = (
  counts: ApiStudentAnalyticsResponse["counts"],
  selectedKey: string,
  filteredTotalCount: number,
): number => {
  if (isAllStudentsSidebarKey(selectedKey)) {
    return filteredTotalCount > 0 ? filteredTotalCount : counts.all;
  }

  if (filteredTotalCount > 0) {
    return filteredTotalCount;
  }

  if (selectedKey.startsWith("student:")) {
    const label = selectedKey.slice("student:".length);
    if (label === "Innovation School") {
      return counts.is_innovation_school;
    }
    if (label === "IS Fellowship") {
      return counts.is_ngo_student;
    }
    if (label === "Maker Skills") {
      return counts.is_maker_skill;
    }
  }

  if (selectedKey.startsWith("residency:")) {
    return counts.residency_not_assigned;
  }

  if (selectedKey.startsWith("cohort:")) {
    const label = selectedKey.slice("cohort:".length);
    return counts.per_residency[label] ?? 0;
  }

  return counts.all;
};

type FetchStudentsParams = {
  page?: number;
  pageSize?: number;
  filters?: ApiFilters;
};

const getBaseUrl = () => {
  const config = getConfig() as Record<string, unknown>;
  const base = String(config.LMS_BASE_URL ?? "");
  return `${base.replace(/\/+$/, "")}/student-analytics/api/students/`;
};

const buildFilterParams = (filters: ApiFilters = {}) => {
  const params: Record<string, string | number | boolean> = {};

  if (filters.is_ngo !== undefined) {
    params.is_ngo = filters.is_ngo;
  }
  if (filters.is_innovation_school !== undefined) {
    params.is_innovation_school = filters.is_innovation_school;
  }
  if (filters.is_maker_skill !== undefined) {
    params.is_maker_skill = filters.is_maker_skill;
  }
  if (filters.residency_assigned !== undefined) {
    params.residency_assigned = filters.residency_assigned;
  }
  if (filters.residency !== undefined) {
    params.residency = filters.residency;
  }
  if (filters.is_residence_ready !== undefined) {
    params.is_residence_ready = filters.is_residence_ready;
  }
  if (filters.inactive_for_two_weeks !== undefined) {
    params.inactive_for_two_weeks = filters.inactive_for_two_weeks;
  }
  const searchQuery = filters.search?.trim();
  if (searchQuery) {
    params.search = searchQuery;
  }

  return params;
};

/** Stable serialization so UI can skip redundant `setApiFilters` when cohort lists refresh after fetch. */
export function serializeApiFilters(filters: ApiFilters): string {
  const keys = (Object.keys(filters) as (keyof ApiFilters)[]).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const v = filters[k];
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return JSON.stringify(out);
}

/**
 * Student analytics list (mentor-style `getAuthenticatedHttpClient`).
 */
export async function fetchStudentsAnalyticsApi({
  page = 1,
  pageSize = 30,
  filters = {},
}: FetchStudentsParams = {}): Promise<ApiStudentAnalyticsResponse> {
  const url = getBaseUrl();
  const params = {
    page,
    page_size: pageSize,
    ...buildFilterParams(filters),
  };

  const { data } = await getAuthenticatedHttpClient().get(url, { params });
  return data as ApiStudentAnalyticsResponse;
}

/**
 * Residency list for cohort sidebar IDs (same client pattern as student analytics).
 */
export async function fetchResidenciesApi(): Promise<ApiResidency[]> {
  const url = getBaseUrl().replace(/\/students\/?$/, "/residencies/");

  const { data } = await getAuthenticatedHttpClient().get(url);
  return Array.isArray(data) ? data : (data.results ?? []);
}

const resolveSiblingApiUrl = (segment: string) =>
  getBaseUrl().replace(/\/students\/?$/, `/${segment}`);

const normalizeCountsPayload = (
  data: unknown,
): ApiStudentAnalyticsResponse["counts"] => {
  if (data && typeof data === "object" && "counts" in data) {
    return (data as { counts: ApiStudentAnalyticsResponse["counts"] }).counts;
  }
  return data as ApiStudentAnalyticsResponse["counts"];
};

/** Map `/counts/filters` payload to the chip total for the filters used in the request. */
export const resolveFilterCountForChip = (
  counts: ApiStudentAnalyticsResponse["counts"],
  filters: ApiFilters,
): number => {
  if (filters.inactive_for_two_weeks === true) {
    return counts.inactive_for_two_weeks;
  }
  if (filters.is_residence_ready === true) {
    return counts.ready_for_residency;
  }
  if (filters.is_residence_ready === false) {
    return counts.not_ready_for_residency;
  }
  return counts.all;
};

/**
 * Left sidebar enrollment counts (All Students, Innovation School, Not Assigned).
 * GET …/student-analytics/api/counts/filters
 */
export async function fetchEnrollmentFilterCountsApi(): Promise<
  ApiStudentAnalyticsResponse["counts"]
> {
  const url = resolveSiblingApiUrl("counts/filters/");

  const { data } = await getAuthenticatedHttpClient().get(url);
  return normalizeCountsPayload(data);
}

/**
 * Left sidebar cohort counts (`per_residency`, ready totals).
 * GET …/student-analytics/api/counts/residencies/
 */
export async function fetchResidencyCountsApi(): Promise<
  ApiStudentAnalyticsResponse["counts"]
> {
  const url = resolveSiblingApiUrl("counts/residencies/");

  const { data } = await getAuthenticatedHttpClient().get(url);
  return normalizeCountsPayload(data);
}

/**
 * Top readiness chip total for the active left-sidebar scope + readiness param.
 * GET …/student-analytics/api/counts/filters?residency=1&is_residence_ready=false
 */
export async function fetchScopedFilterCountsApi(
  filters: ApiFilters = {},
): Promise<number> {
  const url = resolveSiblingApiUrl("counts/filters/");
  const params = buildFilterParams(filters);

  const { data } = await getAuthenticatedHttpClient().get(url, { params });
  return resolveFilterCountForChip(normalizeCountsPayload(data), filters);
}
