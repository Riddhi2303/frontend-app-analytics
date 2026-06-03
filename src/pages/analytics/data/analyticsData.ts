export type OngoingCourse = {
  code: string;
  lastCall: string;
  nextCall: string;
};

export type CourseMetric = {
  gateCompleted: number;
  gateScheduled: number;
  gateTotal: number;
  oraGraded: number;
  oraSubmitted: number;
  oraTotal: number;
  oraPointsObtained: number;
  oraPointsTotal: number;
  mentor: string;
};

export type StudentRecord = {
  id: number;
  name: string;
  cohort: string | null;
  cohortLabel: string;
  category: 'Innovation School' | 'IS Fellowship' | 'Maker Skills';
  residency: 'Not Assigned' | 'Assigned';
  readiness: 'not-ready' | 'ready' | 'inactive';
  ongoingCourses: OngoingCourse[];
  courseMetrics: Record<string, CourseMetric | null>;
};

export type FilterRecord = {
  label: string;
  count: number;
  checked: boolean;
  accent?: 'yellow' | 'red';
};

export type ApiResidency = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
};

export type CohortRecord = {
  id: number;
  label: string;
  schedule: string;
  total: number;
  ready: number;
  checked: boolean;
};

export type ApiOra = {
  submitted: number;
  graded: number;
  total: number;
  points_obtained: number;
  points_total: number;
  passing_grade_percentage: number;
  passing_grade_points: number | null;
};

export type ApiCourse = {
  course_id?: string;
  course_code: string;
  course_name?: string;
  mentor: string;
  last_gate_call: string | null;
  upcoming_gate_call: string | null;
  gate: { completed: number; scheduled: number; total: number };
  ora: ApiOra | null;
};

export type ApiStudent = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_ngo_student: boolean;
  is_innovation_school: boolean;
  is_maker_skill: boolean;
  is_residence_ready: boolean;
  inactive_for_two_weeks: boolean;
  ngo_name?: string | null;
  residency: { name: string | null; start_date: string | null; end_date: string | null };
  courses: ApiCourse[];
};

export type ApiStudentAnalyticsResponse = {
  results: ApiStudent[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  counts: {
    all: number;
    is_innovation_school: number;
    is_ngo_student: number;
    is_maker_skill: number;
    residency_not_assigned: number;
    residency_assigned: number;
    not_ready_for_residency: number;
    ready_for_residency: number;
    inactive_for_two_weeks: number;
    active_last_two_weeks?: number;
    per_residency: Record<string, number>;
    per_residency_ready?: Record<string, number>;
  };
};

const countReadyStudentsByResidency = (students: ApiStudent[]): Record<string, number> => (
  students.reduce<Record<string, number>>((acc, student) => {
    const name = student.residency.name;
    if (!name || !student.is_residence_ready) {
      return acc;
    }
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {})
);

const formatCall = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const lookupCourse = (courses: ApiCourse[], code: string) => (
  courses.find((c) => c.course_code.toUpperCase() === code.toUpperCase())
);

const buildCourseMetric = (course: ApiCourse | undefined): CourseMetric | null => {
  if (!course) return null;
  const ora = course.ora;
  return {
    gateCompleted: course.gate.completed,
    gateScheduled: course.gate.scheduled ?? 0,
    gateTotal: course.gate.total,
    oraGraded: ora?.graded ?? 0,
    oraSubmitted: ora?.submitted ?? 0,
    oraTotal: ora?.total ?? 0,
    oraPointsObtained: ora?.points_obtained ?? 0,
    oraPointsTotal: ora?.points_total ?? 0,
    mentor: course.mentor || '-',
  };
};

const COURSE_ORDER = ['CAD1', 'EMC1', 'ER1', 'IOT1', 'PCB1', 'VR1', 'AIM1'];

/** Collect all unique course codes (upper-cased) across all students, in the prescribed order. */
export const collectCourseCodes = (results: ApiStudent[]): string[] => {
  const seen = new Set<string>();
  for (const student of results) {
    for (const course of student.courses) {
      seen.add(course.course_code.toUpperCase());
    }
  }
  const ordered = COURSE_ORDER.filter((code) => seen.has(code));
  const rest = [...seen].filter((code) => !COURSE_ORDER.includes(code));
  return [...ordered, ...rest];
};

export const mapStudentsFromApi = (results: ApiStudent[]): StudentRecord[] => results.map((student) => {
  const courseMetrics: Record<string, CourseMetric | null> = {};
  for (const course of student.courses) {
    const code = course.course_code.toUpperCase();
    if (!courseMetrics[code]) {
      courseMetrics[code] = buildCourseMetric(course);
    }
  }

  const fullName = `${student.first_name} ${student.last_name}`.trim();
  const category: StudentRecord['category'] = student.is_innovation_school
    ? 'Innovation School'
    : student.is_maker_skill
      ? 'Maker Skills'
      : 'IS Fellowship';

  const activeCourses = student.courses.filter((c) => (
    c.gate.completed < c.gate.total
    && (c.gate.completed > 0 || Boolean(c.last_gate_call) || Boolean(c.upcoming_gate_call))
  ));
  const ongoingSource = activeCourses.length > 0 ? activeCourses : student.courses.slice(0, 1);
  const ongoingCourses: OngoingCourse[] = ongoingSource.map((c) => ({
    code: c.course_code,
    lastCall: formatCall(c.last_gate_call),
    nextCall: formatCall(c.upcoming_gate_call),
  }));

  return {
    id: student.id,
    name: fullName || student.username,
    cohort: student.residency.name ?? null,
    cohortLabel: student.residency.name || 'Not Assigned',
    category,
    residency: student.residency.name ? 'Assigned' : 'Not Assigned',
    readiness: student.is_residence_ready ? 'ready' : (student.inactive_for_two_weeks ? 'inactive' : 'not-ready'),
    ongoingCourses,
    courseMetrics,
  };
});

export const NOT_ASSIGNED_FILTER_LABEL = 'Not Assigned';

export const buildStudentFilters = (counts: ApiStudentAnalyticsResponse['counts']): FilterRecord[] => [
  { label: 'All Students', count: counts.all, checked: true },
  { label: 'Innovation School', count: counts.is_innovation_school, checked: false },
  { label: 'IS Fellowship', count: counts.is_ngo_student, checked: false },
  { label: 'Maker Skills', count: counts.is_maker_skill, checked: false },
];

export const buildNotAssignedFilter = (
  counts: ApiStudentAnalyticsResponse['counts'],
): FilterRecord => ({
  label: NOT_ASSIGNED_FILTER_LABEL,
  count: counts.residency_not_assigned,
  checked: false,
  accent: 'red',
});

const formatResidencySchedule = (startDate: string | null | undefined, endDate: string | null | undefined) => {
  if (!startDate || !endDate) return '-';
  const start = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const end = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${start} - ${end}`;
};

/** Cohort sidebar from residencies API — visible as soon as residencies load; counts from facet API. */
export const buildCohortFiltersFromResidencies = (
  residencies: ApiResidency[],
  counts: ApiStudentAnalyticsResponse['counts'] | null,
  results: ApiStudent[] = [],
): CohortRecord[] => {
  if (residencies.length === 0) {
    return [];
  }

  const perResidency = counts?.per_residency ?? {};
  const readyByResidency = counts?.per_residency_ready ?? (
    results.length > 0 ? countReadyStudentsByResidency(results) : {}
  );

  return residencies.map((residency) => ({
    id: residency.id,
    label: residency.name,
    schedule: formatResidencySchedule(residency.start_date, residency.end_date),
    total: perResidency[residency.name] ?? 0,
    ready: readyByResidency[residency.name] ?? 0,
    checked: false,
  }));
};

export const buildReadinessCounts = (counts: ApiStudentAnalyticsResponse['counts']) => ({
  all: counts.all,
  notReady: counts.not_ready_for_residency,
  ready: counts.ready_for_residency,
  inactive: counts.inactive_for_two_weeks,
});

export type TopFilterCounts = {
  all: number;
  notReady: number;
  ready: number;
  inactive: number;
};

export type TopReadinessCountKey = 'notReady' | 'ready' | 'inactive';

export type TopFilterCountsLoading = Record<keyof TopFilterCounts, boolean>;

export const initialTopFilterCountsLoading = (): TopFilterCountsLoading => ({
  all: false,
  notReady: false,
  ready: false,
  inactive: false,
});

export type TopFilterCountsPartialPayload = {
  key: TopReadinessCountKey;
  totalCount: number;
};

export type TopFilterCountsPayload = {
  topFilterCounts: TopFilterCounts;
};
