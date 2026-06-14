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
  passingGradePercentage: number;
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

export type ApiPracticeAssignment = {
  id?: number;
  title: string;
  submitted?: boolean;
  reviewed?: boolean;
  score?: number | null;
  max_score?: number | null;
};

export type GateCallStatus =
  | 'cancelled'
  | 'mentor_absent'
  | 'student_absent'
  | 'rescheduled'
  | 'reschedule_needed'
  | 'good_to_proceed'
  | 'scheduled'
  | 'completed';

export type ApiGateCall = {
  id?: number;
  title: string;
  start_time: string | null;
  end_time?: string | null;
  status: GateCallStatus | string;
};

export type ApiGateCallRecord = {
  id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  status: string;
  result: string | null;
  failure_reason: string | null;
  description: string | null;
  agenda: string;
  mentor_attendance: boolean;
  organiser_id: number;
  organiser_name: string;
  created: string;
  modified: string;
};

export type ApiGateCallsResponse = {
  results: ApiGateCallRecord[];
};

export type ApiOraDetailRecord = {
  name: string;
  submitted: boolean;
  reviewed: boolean;
  score_earned: number;
  score_possible: number;
};

export type ApiOraDetailsResponse = {
  results: ApiOraDetailRecord[];
};

export type ApiCourse = {
  course_id?: string;
  course_code: string;
  course_name?: string;
  mentor: string;
  mentor_id?: number | null;
  passed?: boolean;
  last_gate_call: string | null;
  upcoming_gate_call: string | null;
  gate: { completed: number; scheduled: number; total: number };
  ora: ApiOra | null;
  assignments?: ApiPracticeAssignment[];
  gate_calls?: ApiGateCall[];
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
    passingGradePercentage: ora?.passing_grade_percentage ?? 0,
    mentor: course.mentor || '-',
  };
};

const COURSE_ORDER = ['CAD1', 'EMC1', 'ER1', 'IOT1', 'PCB1', 'VR1', 'AIM1'];

const courseActivityScore = (course: ApiCourse): number => {
  const gate = course.gate.completed + course.gate.scheduled;
  const ora = course.ora?.submitted ?? 0;
  const points = course.ora?.points_obtained ?? 0;
  const mentorBonus = course.mentor_id ? 1 : 0;
  return gate * 10 + ora * 5 + points + mentorBonus;
};

/** One course per code — prefer the enrollment with the most activity. */
export const pickPrimaryCoursesForDrawer = (courses: ApiCourse[]): ApiCourse[] => {
  const byCode = new Map<string, ApiCourse[]>();
  for (const course of courses) {
    const code = course.course_code.toUpperCase();
    const group = byCode.get(code) ?? [];
    group.push(course);
    byCode.set(code, group);
  }

  const primary = [...byCode.entries()].map(([, group]) => (
    [...group].sort((a, b) => courseActivityScore(b) - courseActivityScore(a))[0]
  ));

  return primary.sort((a, b) => {
    const indexA = COURSE_ORDER.indexOf(a.course_code.toUpperCase());
    const indexB = COURSE_ORDER.indexOf(b.course_code.toUpperCase());
    const orderA = indexA === -1 ? COURSE_ORDER.length : indexA;
    const orderB = indexB === -1 ? COURSE_ORDER.length : indexB;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.course_code.localeCompare(b.course_code);
  });
};

export const formatResidencyRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) => {
  if (!startDate || !endDate) {
    return null;
  }
  const start = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const end = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${start} - ${end}`;
};

export const formatDrawerDateTime = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const time = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}, ${time}`;
};

export const formatDrawerTimeRange = (
  start: string | null | undefined,
  end?: string | null | undefined,
) => {
  const startLabel = formatDrawerDateTime(start);
  if (!startLabel) {
    return null;
  }
  if (!end) {
    return startLabel;
  }
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) {
    return startLabel;
  }
  const endTime = endDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${startLabel} - ${endTime}`;
};

export const studentDisplayName = (student: ApiStudent) => {
  const fullName = `${student.first_name} ${student.last_name}`.trim();
  return fullName || student.username;
};

/** Fallback call rows from list API when gate-calls detail is unavailable. */
export const buildFallbackGateCalls = (course: ApiCourse): ApiGateCall[] => {
  const calls: ApiGateCall[] = [];
  if (course.last_gate_call) {
    calls.push({
      title: `Call ${Math.max(course.gate.completed, 1)}: Last completed call`,
      start_time: course.last_gate_call,
      status: 'good_to_proceed',
    });
  }
  if (course.upcoming_gate_call) {
    calls.push({
      title: `Call ${course.gate.completed + 1}: Upcoming call`,
      start_time: course.upcoming_gate_call,
      status: 'scheduled',
    });
  }
  return calls;
};

export const resolveGateCallDisplayStatus = (record: ApiGateCallRecord): GateCallStatus | string => {
  const status = record.status?.toLowerCase() ?? '';

  if (status === 'cancelled') {
    return 'cancelled';
  }
  if (status === 'rescheduled') {
    return 'rescheduled';
  }

  if (record.result === 'passed') {
    return 'good_to_proceed';
  }

  if (record.result === 'failed') {
    const reason = record.failure_reason?.toLowerCase();
    if (reason === 'absent') {
      return record.mentor_attendance ? 'student_absent' : 'mentor_absent';
    }
    return 'reschedule_needed';
  }

  if (status === 'confirmed' || status === 'scheduled') {
    return 'scheduled';
  }

  return status || 'scheduled';
};

export const mapGateCallRecordToDrawer = (record: ApiGateCallRecord): ApiGateCall => ({
  id: record.id,
  title: record.event_name,
  start_time: record.start_time,
  end_time: record.end_time,
  status: resolveGateCallDisplayStatus(record),
});

export const mapOraDetailRecordToAssignment = (record: ApiOraDetailRecord): ApiPracticeAssignment => ({
  title: record.name,
  submitted: record.submitted,
  reviewed: record.reviewed,
  score: record.score_earned,
  max_score: record.score_possible,
});

export const sumPracticeAssignmentScores = (assignments: ApiPracticeAssignment[]) => {
  const earned = assignments.reduce((sum, assignment) => sum + (assignment.score ?? 0), 0);
  const possible = assignments.reduce((sum, assignment) => sum + (assignment.max_score ?? 0), 0);
  return { earned, possible };
};

export type CourseDrawerTabStatus = 'completed' | 'in-progress' | 'not-started';

/** Drawer course tab color: green = completed, blue = in progress, black = not started. */
export const getCourseDrawerTabStatus = (course: ApiCourse): CourseDrawerTabStatus => {
  const ora = course.ora;
  const gateTotal = course.gate.total;
  const gateComplete = gateTotal > 0 && course.gate.completed >= gateTotal;
  const isOraless = (ora?.total ?? 0) === 0;
  const oraPassingGrade = (ora?.points_total ?? 0) > 0
    && (ora?.passing_grade_percentage ?? 0) > 0
    && ((ora?.points_obtained ?? 0) / (ora?.points_total ?? 1)) >= (ora?.passing_grade_percentage ?? 0);

  if (course.passed || (isOraless && gateComplete) || (!isOraless && oraPassingGrade)) {
    return 'completed';
  }

  const hasActivity = course.gate.completed > 0
    || course.gate.scheduled > 0
    || (ora?.submitted ?? 0) > 0
    || (ora?.graded ?? 0) > 0
    || Boolean(course.last_gate_call)
    || Boolean(course.upcoming_gate_call);

  if (hasActivity) {
    return 'in-progress';
  }

  return 'not-started';
};

export const formatGateCallTimeRange = (
  start: string | null | undefined,
  end?: string | null | undefined,
) => {
  if (!start) {
    return null;
  }
  if (!end) {
    return start;
  }
  const endTimeOnly = end.includes(', ') ? end.split(', ').slice(1).join(', ') : end;
  return `${start} - ${endTimeOnly}`;
};

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
