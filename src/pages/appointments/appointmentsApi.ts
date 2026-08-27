import axios from 'axios';

import { fetchAccessTokenApi } from '../analytics/data/api';
import type {
  ApiEventCounts,
  ApiMentoringEventsResponse,
  AppointmentCourseOption,
} from './appointmentsData';

/** Empty in development so webpack-dev-server proxy handles CORS; absolute in production. */
const MASH_API_ORIGIN =
  process.env.NODE_ENV === 'development' ? '' : 'https://mash.makersasylum.com';

const MENTORING_EVENTS_URL = `${MASH_API_ORIGIN}/mentoring/api/v1/mentoring-events/`;
const FILTER_OPTIONS_URL = `${MASH_API_ORIGIN}/mentoring/api/v1/filter-options/`;
const EVENT_COUNTS_URL = `${MASH_API_ORIGIN}/mentoring/api/v1/event-counts/`;
const COURSES_LIST_URL = `${MASH_API_ORIGIN}/api/courses/v1/courses/`;

export type MentoringListFilters = {
  mentor?: string;
  student?: string;
  courseId?: string;
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
  if (filters.courseId) {
    params.course_id = filters.courseId;
  }
};

export type ApiFilterOptionsResponse = {
  mentors: string[];
  students: string[];
};

export type ApiCourseListItem = {
  id?: string;
  course_id?: string;
  name?: string;
  number?: string;
  hidden?: boolean;
};

export type ApiCourseListResponse = {
  results?: ApiCourseListItem[];
  next?: string | null;
  pagination?: {
    next?: string | null;
    previous?: string | null;
    count?: number;
    num_pages?: number;
  };
};

const mapCourseToOption = (course: ApiCourseListItem): AppointmentCourseOption | null => {
  if (course.hidden) {
    return null;
  }
  const courseId = course.id || course.course_id || '';
  if (!courseId) {
    return null;
  }
  return {
    code: courseId,
    name: course.name || course.number || courseId,
  };
};

export async function fetchCoursesListApi(): Promise<AppointmentCourseOption[]> {
  const accessToken = await fetchAccessTokenApi();
  const options: AppointmentCourseOption[] = [];
  const seen = new Set<string>();
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const { data } = await axios.get<ApiCourseListResponse>(COURSES_LIST_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const results = Array.isArray(data?.results) ? data.results : [];
    results.forEach((course) => {
      const option = mapCourseToOption(course);
      if (!option || seen.has(option.code)) {
        return;
      }
      seen.add(option.code);
      options.push(option);
    });
    hasNext = Boolean(data?.pagination?.next ?? data?.next);
    page += 1;
    if (page > 50) {
      break;
    }
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

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
  };
}

export async function fetchEventCountsApi(
): Promise<ApiEventCounts> {
  try {
    const accessToken = await fetchAccessTokenApi();
  
console.log('ApiEventCounts',EVENT_COUNTS_URL,"fetchEventCountsApi")
    const { data } = await axios.get<ApiEventCounts>(EVENT_COUNTS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return data ?? {};
  } catch (error) {
    console.error('Error fetching event counts:', error);
    return {};
  }
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
console.log('ApiMentoringEventsResponse',MENTORING_EVENTS_URL,"fetchMentoringEventsApi")
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
