import axios from 'axios';

import { fetchAccessTokenApi } from '../analytics/data/api';
import type { ApiEventCounts, ApiMentoringEventsResponse } from './appointmentsData';

/** Empty in development so webpack-dev-server proxy handles CORS; absolute in production. */
const MASH_API_ORIGIN =
  process.env.NODE_ENV === 'development' ? '' : 'https://mash.makersasylum.com';

const MENTORING_EVENTS_URL = `${MASH_API_ORIGIN}/mentoring/api/v1/mentoring-events/`;
const FILTER_OPTIONS_URL = `${MASH_API_ORIGIN}/mentoring/api/v1/filter-options/`;
const EVENT_COUNTS_URL = `${MASH_API_ORIGIN}/mentoring/api/v1/event-counts/`;

export type MentoringListFilters = {
  mentor?: string;
  student?: string;
  course?: string;
};

export type MentoringEventsQuery = MentoringListFilters & {
  limit?: number;
  offset?: number;
  ordering?: string;
  statusFilter?: string;
};

const applyListFilters = (
  params: Record<string, string | number>,
  filters: MentoringListFilters,
) => {
  if (filters.mentor) {
    params.mentor = filters.mentor;
  }
  if (filters.student) {
    params.student = filters.student;
  }
  if (filters.course) {
    params.course = filters.course;
  }
};

export type ApiFilterOptionsResponse = {
  mentors: string[];
  students: string[];
  courses: Array<{ value: string; label: string }>;
};

export async function fetchFilterOptionsApi(
  student = 'admin',
): Promise<ApiFilterOptionsResponse> {
  const accessToken = await fetchAccessTokenApi();
  const { data } = await axios.get<ApiFilterOptionsResponse>(FILTER_OPTIONS_URL, {
    params: { student },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    mentors: Array.isArray(data?.mentors) ? data.mentors : [],
    students: Array.isArray(data?.students) ? data.students : [],
    courses: Array.isArray(data?.courses) ? data.courses : [],
  };
}

export async function fetchEventCountsApi(
  filters: MentoringListFilters = {},
): Promise<ApiEventCounts> {
  const accessToken = await fetchAccessTokenApi();
  const params: Record<string, string | number> = {};
  applyListFilters(params, filters);

  const { data } = await axios.get<ApiEventCounts>(EVENT_COUNTS_URL, {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return data ?? {};
}

export async function fetchMentoringEventsApi(
  query: MentoringEventsQuery = {},
): Promise<ApiMentoringEventsResponse> {
  const accessToken = await fetchAccessTokenApi();
  const params: Record<string, string | number> = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    ordering: query.ordering ?? '-start_time',
  };

  if (query.statusFilter) {
    params.status_filter = query.statusFilter;
  }
  applyListFilters(params, query);

  const { data } = await axios.get<ApiMentoringEventsResponse>(MENTORING_EVENTS_URL, {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    count: data?.count ?? 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: Array.isArray(data?.results) ? data.results : [],
    total_calculated_amount: data?.total_calculated_amount ?? null,
    ai_total_calculated_amount: data?.ai_total_calculated_amount ?? null,
    maf_total_calculated_amount: data?.maf_total_calculated_amount ?? null,
  };
}
