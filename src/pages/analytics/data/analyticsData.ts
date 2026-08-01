export type OngoingCourse = {
  code: string;
  lastCall: string;
  nextCall: string;
};

export type CourseMetric = {
  courseCode: string;
  courseName: string;
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

export type ApiResidencySeason = 'summer' | 'winter' | string;

export type ApiResidency = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  season?: ApiResidencySeason | null;
};

export type ApiResidenciesResponse = {
  results: ApiResidency[];
  available_years?: number[];
};

export type CohortRecord = {
  id: number;
  label: string;
  schedule: string;
  total: number;
  ready: number;
  checked: boolean;
};

/** Hard-coded IS Year options (sidebar). */
export const IS_YEAR_OPTIONS = ['2026', '2027', 'not-assigned'] as const;
export type IsYearOption = (typeof IS_YEAR_OPTIONS)[number];

export const IS_SEASON_OPTIONS = ['summer', 'winter', 'not-assigned'] as const;
export type IsSeasonOption = (typeof IS_SEASON_OPTIONS)[number];

export const DEFAULT_IS_YEAR: IsYearOption = '2026';
export const DEFAULT_IS_SEASON: IsSeasonOption = 'winter';

export const isYearActiveForSeason = (year: IsYearOption | null): boolean => (
  year === '2026' || year === '2027'
);

export const isSeasonActiveForCohort = (season: IsSeasonOption | null): boolean => (
  season === 'summer' || season === 'winter'
);

/** Year from residency name (`2026 Summer Cohort 3`) or start_date. */
export const residencyYear = (residency: ApiResidency): string | null => {
  const fromName = residency.name.match(/\b(20\d{2})\b/);
  if (fromName) {
    return fromName[1];
  }
  const start = parseApiDateTime(residency.start_date);
  if (start) {
    return String(start.getFullYear());
  }
  return null;
};

export const residencySeason = (residency: ApiResidency): 'summer' | 'winter' | null => {
  const raw = (residency.season ?? '').toString().trim().toLowerCase();
  if (raw === 'summer' || raw === 'winter') {
    return raw;
  }
  const fromName = residency.name.toLowerCase();
  if (fromName.includes('summer')) {
    return 'summer';
  }
  if (fromName.includes('winter') || fromName.includes('dussehra')) {
    return 'winter';
  }
  return null;
};

/** e.g. `Cohort 3 : 20 Jun - 26 May` */
export const formatCohortSidebarLabel = (residency: ApiResidency): string => {
  const cohortMatch = residency.name.match(/Cohort\s+(\d+)/i);
  const title = cohortMatch
    ? `Cohort ${cohortMatch[1]}`
    : residency.name.replace(/^\d{4}\s+(Summer|Winter)\s+/i, '').trim() || residency.name;

  const start = parseApiDateTime(residency.start_date);
  const end = parseApiDateTime(residency.end_date);
  if (!start || !end) {
    return title;
  }

  const fmt = (date: Date) => date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return `${title} : ${fmt(start)} - ${fmt(end)}`;
};

export const filterResidenciesByYearSeason = (
  residencies: ApiResidency[],
  year: IsYearOption | null,
  season: IsSeasonOption | null,
): ApiResidency[] => {
  if (!isYearActiveForSeason(year) || !isSeasonActiveForCohort(season)) {
    return [];
  }

  return residencies.filter((residency) => {
    const y = residencyYear(residency);
    const s = residencySeason(residency);
    return y === year && s === season;
  });
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
    /** Sidebar IS Year counts — keys like `"2026"`, `"2027"`, `"unassigned"`. */
    per_year?: Record<string, number>;
    /** Sidebar IS Season counts — keys `"summer"`, `"winter"`, `"unassigned"`. */
    per_season?: {
      summer?: number;
      winter?: number;
      unassigned?: number;
      [key: string]: number | undefined;
    };
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

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const DISPLAY_DATETIME_RE = /^(\d{1,2})\s+(\w{3})\s+(\d{4}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_NO_TZ_RE = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)$/;

/** Build a Date from UTC wall-clock components. */
const dateFromUtcWallClock = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
) => new Date(Date.UTC(year, month, day, hours, minutes));

const dateFromUtcDateOnly = (year: number, month: number, day: number) => (
  dateFromUtcWallClock(year, month - 1, day, 0, 0)
);

/**
 * Parse API date/time strings (UTC) into a Date instant for local display.
 * ISO/UTC strings and human-readable UTC values are supported.
 */
export const parseApiDateTime = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dateOnlyMatch = trimmed.match(DATE_ONLY_RE);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return dateFromUtcDateOnly(Number(year), Number(month), Number(day));
  }

  const isoNoTzMatch = trimmed.match(ISO_DATETIME_NO_TZ_RE);
  if (isoNoTzMatch) {
    const [, datePart, timePart] = isoNoTzMatch;
    return new Date(`${datePart}T${timePart}Z`);
  }

  const displayMatch = trimmed.match(DISPLAY_DATETIME_RE);
  if (displayMatch) {
    const [, day, monthStr, year, hour, minute, ampm] = displayMatch;
    const month = MONTH_INDEX[monthStr.toLowerCase().slice(0, 3)];
    if (month == null) {
      return null;
    }
    let hours = Number(hour);
    const minutes = Number(minute);
    if (ampm.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (ampm.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    return dateFromUtcWallClock(Number(year), month, Number(day), hours, minutes);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatLocalDate = (date: Date) => date.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
});

const formatLocalTime = (date: Date) => date.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const formatCall = (value: string | null) => {
  if (!value) return '-';
  const date = parseApiDateTime(value);
  if (!date) {
    return value;
  }
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const lookupCourse = (courses: ApiCourse[], code: string) => (
  courses.find((c) => c.course_code.toUpperCase() === code.toUpperCase())
);

const buildCourseMetric = (course: ApiCourse | undefined): CourseMetric | null => {
  if (!course) return null;
  const ora = course.ora;
  return {
    courseCode: course.course_code,
    courseName: course.course_name ?? course.course_code,
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
  const start = parseApiDateTime(startDate);
  const end = parseApiDateTime(endDate);
  if (!start || !end) {
    return null;
  }
  return `${formatLocalDate(start)} - ${formatLocalDate(end)}`;
};

export const formatDrawerDateTime = (value: string | null | undefined) => {
  const date = parseApiDateTime(value);
  if (!date) {
    return null;
  }
  return `${formatLocalDate(date)}, ${formatLocalTime(date)}`;
};

export const formatDrawerTimeRange = (
  start: string | null | undefined,
  end?: string | null | undefined,
) => {
  const startDate = parseApiDateTime(start);
  if (!startDate) {
    return null;
  }
  const startLabel = `${formatLocalDate(startDate)}, ${formatLocalTime(startDate)}`;
  if (!end) {
    return startLabel;
  }
  const endDate = parseApiDateTime(end);
  if (!endDate) {
    return startLabel;
  }
  return `${startLabel} - ${formatLocalTime(endDate)}`;
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

const isCourseCompleted = (course: ApiCourse): boolean => {
  const ora = course.ora;
  const gateTotal = course.gate.total;
  const gateComplete = gateTotal > 0 && course.gate.completed >= gateTotal;
  const isOraless = (ora?.total ?? 0) === 0;
  const oraPassingGrade = (ora?.points_total ?? 0) > 0
    && (ora?.passing_grade_percentage ?? 0) > 0
    && ((ora?.points_obtained ?? 0) / (ora?.points_total ?? 1)) >= (ora?.passing_grade_percentage ?? 0);

  return Boolean(course.passed)
    || (isOraless && gateComplete)
    || (!isOraless && oraPassingGrade);
};

/** Gate/ORA/call activity — shared by drawer tabs and main-list Ongoing column. */
export const hasCourseActivity = (course: ApiCourse): boolean => {
  const ora = course.ora;
  return course.gate.completed > 0
    || course.gate.scheduled > 0
    || (ora?.submitted ?? 0) > 0
    || (ora?.graded ?? 0) > 0
    || Boolean(course.last_gate_call)
    || Boolean(course.upcoming_gate_call);
};

/** Drawer course tab color: green = completed, blue = in progress, black = not started. */
export const getCourseDrawerTabStatus = (course: ApiCourse): CourseDrawerTabStatus => {
  if (isCourseCompleted(course)) {
    return 'completed';
  }

  if (hasCourseActivity(course)) {
    return 'in-progress';
  }

  return 'not-started';
};

/** Same condition as drawer blue (in-progress) tabs. */
export const isCourseOngoing = (course: ApiCourse): boolean => (
  getCourseDrawerTabStatus(course) === 'in-progress'
);

/** Ongoing column: primary enrollment per course code, in-progress only. */
export const getOngoingCourses = (courses: ApiCourse[]): OngoingCourse[] => (
  pickPrimaryCoursesForDrawer(courses)
    .filter(isCourseOngoing)
    .map((course) => ({
      code: course.course_code,
      lastCall: formatCall(course.last_gate_call),
      nextCall: formatCall(course.upcoming_gate_call),
    }))
);

export const formatGateCallTimeRange = (
  start: string | null | undefined,
  end?: string | null | undefined,
) => formatDrawerTimeRange(start, end);

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

  const ongoingCourses = getOngoingCourses(student.courses);

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
  const range = formatResidencyRange(startDate, endDate);
  return range ?? '-';
};

const lookupResidencyCount = (
  map: Record<string, number>,
  residency: ApiResidency,
): number => (
  map[residency.name]
  ?? map[String(residency.id)]
  ?? 0
);

/** Sidebar IS Year counts from API `counts.per_year` (`unassigned` → Not Assigned). */
export const buildYearCountsFromApi = (
  counts: ApiStudentAnalyticsResponse['counts'] | null,
): Record<IsYearOption, number> => {
  const perYear = counts?.per_year ?? {};
  return {
    '2026': perYear['2026'] ?? 0,
    '2027': perYear['2027'] ?? 0,
    'not-assigned': perYear.unassigned ?? counts?.residency_not_assigned ?? 0,
  };
};

/** Sidebar IS Season counts from API `counts.per_season` (`unassigned` → Not Assigned). */
export const buildSeasonCountsFromApi = (
  counts: ApiStudentAnalyticsResponse['counts'] | null,
): Record<IsSeasonOption, number> => {
  const perSeason = counts?.per_season ?? {};
  return {
    summer: perSeason.summer ?? 0,
    winter: perSeason.winter ?? 0,
    'not-assigned': perSeason.unassigned ?? 0,
  };
};

/** Cohort sidebar from residencies API — visible as soon as residencies load; counts from facet API. */
export const buildCohortFiltersFromResidencies = (
  residencies: ApiResidency[],
  counts: ApiStudentAnalyticsResponse['counts'] | null,
  results: ApiStudent[] = [],
  year: IsYearOption | null = null,
  season: IsSeasonOption | null = null,
): CohortRecord[] => {
  const scoped = (year && season)
    ? filterResidenciesByYearSeason(residencies, year, season)
    : residencies;

  if (scoped.length === 0) {
    return [];
  }

  const perResidency = counts?.per_residency ?? {};
  const readyByResidency = counts?.per_residency_ready ?? (
    results.length > 0 ? countReadyStudentsByResidency(results) : {}
  );

  return scoped.map((residency) => ({
    id: residency.id,
    label: formatCohortSidebarLabel(residency),
    schedule: formatResidencySchedule(residency.start_date, residency.end_date),
    total: lookupResidencyCount(perResidency, residency),
    ready: lookupResidencyCount(readyByResidency, residency),
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
