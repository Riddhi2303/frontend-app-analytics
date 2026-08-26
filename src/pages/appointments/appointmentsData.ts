export type AppointmentStatus =
  | 'Scheduled'
  | 'Good to proceed'
  | 'Revision AND/OR Reschedule Needed'
  | 'Student was absent'
  | 'Mentor was absent'
  | 'Rescheduled'
  | 'Cancelled'
  | 'Pending'
  | 'Not Booked';

export type Attendance = 'Present' | 'Absent' | null;

export type AppointmentCategory =
  | 'upcoming'
  | 'review-pending'
  | 'completed-ai'
  | 'completed-maf'
  | 'student-absent'
  | 'mentor-absent'
  | 'cancelled-rescheduled';

export type InvoiceType = 'AI' | 'MAF' | null;

export type AppointmentCategoryFilter = AppointmentCategory | 'all';

export const CATEGORY_STATUS_FILTER: Record<AppointmentCategoryFilter, string | undefined> = {
  upcoming: 'upcoming',
  'review-pending': 'review_pending',
  'completed-ai': 'completed_calls',
  'completed-maf': 'completed_maf',
  'student-absent': 'student_absent',
  'mentor-absent': 'mentor_absent',
  'cancelled-rescheduled': 'cancelled_rescheduled',
  all: undefined,
};

export type ApiEventCounts = {
  all_scheduled?: number;
  upcoming?: number;
  completed_calls?: number;
  completed_maf?: number;
  student_absent?: number;
  mentor_absent?: number;
  cancelled_rescheduled?: number;
  review_pending?: number;
};

export const EMPTY_CATEGORY_COUNTS: Record<AppointmentCategoryFilter, number> = {
  all: 0,
  upcoming: 0,
  'review-pending': 0,
  'completed-ai': 0,
  'completed-maf': 0,
  'student-absent': 0,
  'mentor-absent': 0,
  'cancelled-rescheduled': 0,
};

export const mapEventCounts = (data: ApiEventCounts): Record<AppointmentCategoryFilter, number> => {
  const upcoming = data.upcoming ?? 0;
  const reviewPending = data.review_pending ?? 0;
  const completedAi = data.completed_calls ?? 0;
  const completedMaf = data.completed_maf ?? 0;
  const studentAbsent = data.student_absent ?? 0;
  const mentorAbsent = data.mentor_absent ?? 0;
  const cancelled = data.cancelled_rescheduled ?? 0;
  const allScheduled = data.all_scheduled ?? 0;

  return {
    upcoming,
    'review-pending': reviewPending,
    'completed-ai': completedAi,
    'completed-maf': completedMaf,
    'student-absent': studentAbsent,
    'mentor-absent': mentorAbsent,
    'cancelled-rescheduled': cancelled,
    all: allScheduled + reviewPending + completedAi + completedMaf + studentAbsent + mentorAbsent + cancelled,
  };
};

export type AppointmentRecord = {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  date: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  meetUrl: string | null;
  canJoin: boolean;
  studentName: string;
  studentAttendance: Attendance;
  agenda: string;
  mentorName: string;
  mentorAttendance: Attendance;
  mentorComments: string;
  invoiceType: InvoiceType;
  invoiceAmount: number | null;
  statusDetail: string | null;
};

export const COURSES = [
  { code: 'all', name: 'All Courses' },
] as const;

export type AppointmentCourseOption = {
  code: string;
  name: string;
};

export const formatUsername = (value: string) => {
  if (!value || value.includes('@') || value.includes(' ') || /[._-]/.test(value)) {
    return value;
  }
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
};

const FIGMA_AGENDA = 'I want to understand the aspects of engineering which I will learn and explore through in this course & discuss projects I could end up building by the end!';

export const SAMPLE_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: '1',
    title: 'EMC1 Call 3: Blinking an RGB LED',
    courseCode: 'EMC1',
    courseName: 'Electronics and Microcontrollers',
    date: '03 Mar 2026',
    start: '1:30 PM',
    end: '2:30 PM',
    status: 'Scheduled',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    canJoin: true,
    studentName: 'Sovan Dhal',
    studentAttendance: null,
    agenda: FIGMA_AGENDA,
    mentorName: 'Lakshdip Faterpekar',
    mentorAttendance: null,
    mentorComments: '',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: null,
  },
  {
    id: '2',
    title: 'EMC1 Call 3: Blinking an RGB LED',
    courseCode: 'EMC1',
    courseName: 'Electronics and Microcontrollers',
    date: '03 Mar 2026',
    start: '1:30 PM',
    end: '2:30 PM',
    status: 'Scheduled',
    meetUrl: 'https://meet.google.com/xyz-uvwx-yz',
    canJoin: false,
    studentName: 'Sovan Dhal',
    studentAttendance: null,
    agenda: FIGMA_AGENDA,
    mentorName: 'Lakshdip Faterpekar',
    mentorAttendance: null,
    mentorComments: '',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: null,
  },
  {
    id: '3',
    title: 'CAD1 Call 5: Parametric Modelling',
    courseCode: 'CAD1',
    courseName: 'Computer Aided Design',
    date: '02 Mar 2026',
    start: '7:30 PM',
    end: '8:15 PM',
    status: 'Good to proceed',
    meetUrl: null,
    canJoin: false,
    studentName: 'Aarav Gupta',
    studentAttendance: 'Present',
    agenda: 'Review constraints on the stand model and next print settings.',
    mentorName: 'Priya Shah',
    mentorAttendance: 'Present',
    mentorComments: 'Clear understanding of joints. Ready for next module.',
    invoiceType: 'AI',
    invoiceAmount: 23750,
    statusDetail: null,
  },
  {
    id: '4',
    title: 'IOT1 Call 2: Object and its Stand',
    courseCode: 'IOT1',
    courseName: 'Internet of Things',
    date: '01 Mar 2026',
    start: '4:00 PM',
    end: '4:45 PM',
    status: 'Revision AND/OR Reschedule Needed',
    meetUrl: null,
    canJoin: false,
    studentName: 'Meera Iyer',
    studentAttendance: 'Present',
    agenda: 'Sensor wiring review and firmware flash steps.',
    mentorName: 'Rahul Mehta',
    mentorAttendance: 'Present',
    mentorComments: 'Need a cleaner wiring photo before we proceed.',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: null,
  },
  {
    id: '5',
    title: 'CAD1 Call 1: Meet my Mentor',
    courseCode: 'CAD1',
    courseName: 'Computer Aided Design',
    date: '28 Feb 2026',
    start: '11:00 AM',
    end: '11:30 AM',
    status: 'Student was absent',
    meetUrl: null,
    canJoin: false,
    studentName: 'Sovan Dhal',
    studentAttendance: 'Absent',
    agenda: 'Intro call and project plan.',
    mentorName: 'Priya Shah',
    mentorAttendance: 'Present',
    mentorComments: '',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: null,
  },
  {
    id: '6',
    title: 'EMC1 Call 4: Making a holder',
    courseCode: 'EMC1',
    courseName: 'Electronics and Microcontrollers',
    date: '27 Feb 2026',
    start: '2:00 PM',
    end: '2:30 PM',
    status: 'Mentor was absent',
    meetUrl: null,
    canJoin: false,
    studentName: 'Aarav Gupta',
    studentAttendance: 'Present',
    agenda: 'Holder print review.',
    mentorName: 'Lakshdip Faterpekar',
    mentorAttendance: 'Absent',
    mentorComments: '',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: null,
  },
  {
    id: '7',
    title: 'IOT1 Call 6: Personalised Robotic Arm',
    courseCode: 'IOT1',
    courseName: 'Internet of Things',
    date: '26 Feb 2026',
    start: '5:00 PM',
    end: '5:40 PM',
    status: 'Rescheduled',
    meetUrl: null,
    canJoin: false,
    studentName: 'Sovan Dhal',
    studentAttendance: null,
    agenda: 'Arm assembly checkpoint.',
    mentorName: 'Rahul Mehta',
    mentorAttendance: null,
    mentorComments: '',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: 'at 5:45pm on 02 Mar by Sovan',
  },
  {
    id: '8',
    title: 'CAD1 Call 3: Three Section Glass Tumbler',
    courseCode: 'CAD1',
    courseName: 'Computer Aided Design',
    date: '25 Feb 2026',
    start: '10:00 AM',
    end: '10:30 AM',
    status: 'Cancelled',
    meetUrl: null,
    canJoin: false,
    studentName: 'Meera Iyer',
    studentAttendance: null,
    agenda: 'Tumbler wall thickness review.',
    mentorName: 'Priya Shah',
    mentorAttendance: null,
    mentorComments: '',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: 'at 9:04am on 24 Feb by Priya',
  },
  {
    id: '9',
    title: 'EMC1 Call 2: Object and its Stand',
    courseCode: 'EMC1',
    courseName: 'Electronics and Microcontrollers',
    date: '24 Feb 2026',
    start: '3:00 PM',
    end: '3:30 PM',
    status: 'Revision AND/OR Reschedule Needed',
    meetUrl: null,
    canJoin: false,
    studentName: 'Aarav Gupta',
    studentAttendance: null,
    agenda: 'Waiting on student photos of the stand.',
    mentorName: 'Lakshdip Faterpekar',
    mentorAttendance: null,
    mentorComments: '',
    invoiceType: null,
    invoiceAmount: null,
    statusDetail: null,
  },
  {
    id: '10',
    title: 'IOT1 Call 1: Meet my Mentor',
    courseCode: 'IOT1',
    courseName: 'Internet of Things',
    date: '20 Feb 2026',
    start: '10:00 AM',
    end: '10:30 AM',
    status: 'Good to proceed',
    meetUrl: null,
    canJoin: false,
    studentName: 'Meera Iyer',
    studentAttendance: 'Present',
    agenda: 'Intro call and project plan.',
    mentorName: 'Rahul Mehta',
    mentorAttendance: 'Present',
    mentorComments: 'Good first call, ready to start the build.',
    invoiceType: 'MAF',
    invoiceAmount: 7750,
    statusDetail: null,
  },
];

export const uniqueMentors = (rows: AppointmentRecord[]) => (
  [...new Set(rows.map((row) => row.mentorName).filter(Boolean))].sort()
);

export const uniqueStudents = (rows: AppointmentRecord[]) => (
  [...new Set(rows.map((row) => row.studentName).filter(Boolean))].sort()
);

export const uniqueMonths = (rows: AppointmentRecord[]) => (
  [...new Set(rows.map((row) => row.date.replace(/^\d{2}\s/, '')).filter(Boolean))].sort()
);

export const getAppointmentCategory = (row: AppointmentRecord): AppointmentCategory => {
  switch (row.status) {
    case 'Cancelled':
    case 'Rescheduled':
      return 'cancelled-rescheduled';
    case 'Student was absent':
      return 'student-absent';
    case 'Mentor was absent':
      return 'mentor-absent';
    case 'Revision AND/OR Reschedule Needed':
      return 'review-pending';
    case 'Good to proceed':
      return row.invoiceType === 'MAF' ? 'completed-maf' : 'completed-ai';
    default:
      return 'upcoming';
  }
};

export const sumInvoiceAmount = (rows: AppointmentRecord[], type: 'AI' | 'MAF') => (
  rows.reduce((total, row) => (row.invoiceType === type ? total + (row.invoiceAmount ?? 0) : total), 0)
);

export const formatInr = (amount: number) => (
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
);

export const statusClassName = (status: AppointmentStatus) => {
  switch (status) {
    case 'Scheduled':
      return 'appt-status--scheduled';
    case 'Good to proceed':
    case 'Revision AND/OR Reschedule Needed':
      return 'appt-status--positive';
    case 'Student was absent':
    case 'Mentor was absent':
      return 'appt-status--absent';
    case 'Rescheduled':
    case 'Cancelled':
      return 'appt-status--neutral';
    case 'Pending':
      return 'appt-status--pending';
    default:
      return 'appt-status--muted';
  }
};

export type ApiMentoringEventGuest = {
  id?: number;
  full_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_staff?: boolean;
  is_mentor?: boolean;
  role?: string;
};

export type ApiMentoringEvent = {
  id?: number | string;
  event_name?: string;
  title?: string;
  name?: string;
  start_time?: string | null;
  end_time?: string | null;
  status?: string | null;
  result?: string | null;
  failure_reason?: string | null;
  agenda?: string | null;
  description?: string | null;
  meeting_link?: string | null;
  meet_link?: string | null;
  google_meet_link?: string | null;
  can_join?: boolean;
  guests?: ApiMentoringEventGuest[];
  organiser_id?: number;
  organiser_name?: string | null;
  mentor?: string | { name?: string; full_name?: string } | null;
  mentor_attendance?: boolean | null;
  student_attendance?: boolean | null;
  course?: string | {
    code?: string;
    course_code?: string;
    name?: string;
    course_name?: string;
  } | null;
  course_code?: string | null;
  course_name?: string | null;
  calculated_amount?: number | null;
  invoice_type?: string | null;
};

export type ApiMentoringEventsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiMentoringEvent[];
  total_calculated_amount?: number | null;
  ai_total_calculated_amount?: number | null;
  maf_total_calculated_amount?: number | null;
};

const DISPLAY_STATUS: Record<string, AppointmentStatus> = {
  scheduled: 'Scheduled',
  confirmed: 'Scheduled',
  good_to_proceed: 'Good to proceed',
  completed: 'Good to proceed',
  reschedule_needed: 'Revision AND/OR Reschedule Needed',
  revision_needed: 'Revision AND/OR Reschedule Needed',
  pending_review: 'Revision AND/OR Reschedule Needed',
  student_was_absent: 'Student was absent',
  student_absent: 'Student was absent',
  mentor_was_absent: 'Mentor was absent',
  mentor_absent: 'Mentor was absent',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
  pending: 'Pending',
  not_booked: 'Not Booked',
  'not booked': 'Not Booked',
};

const personName = (guest?: ApiMentoringEventGuest | null) => {
  if (!guest) {
    return '';
  }
  const full = guest.full_name
    || [guest.first_name, guest.last_name].filter(Boolean).join(' ')
    || guest.name
    || guest.username
    || '';
  return full.trim();
};

const formatClock = (iso: string | null | undefined) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatDay = (iso: string | null | undefined) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).replace(/ /g, ' ');
};

const resolveMeetUrl = (event: ApiMentoringEvent) => (
  event.meeting_link || event.meet_link || event.google_meet_link || null
);

const resolveCourse = (event: ApiMentoringEvent) => {
  if (event.course && typeof event.course === 'object') {
    return {
      code: event.course.course_code || event.course.code || event.course_code || '',
      name: event.course.course_name || event.course.name || event.course_name || '',
    };
  }
  if (typeof event.course === 'string' && event.course.trim()) {
    return { code: event.course_code || '', name: event.course };
  }
  return {
    code: event.course_code || '',
    name: event.course_name || '',
  };
};

const resolveStatus = (event: ApiMentoringEvent): AppointmentStatus => {
  const raw = (event.status || '').toLowerCase().replace(/-/g, '_').trim();
  const result = (event.result || '').toLowerCase();
  const reason = (event.failure_reason || '').toLowerCase();

  if (raw === 'cancelled') {
    return 'Cancelled';
  }
  if (raw === 'rescheduled') {
    return 'Rescheduled';
  }
  if (result === 'passed') {
    return 'Good to proceed';
  }
  if (result === 'failed') {
    if (reason === 'absent') {
      return event.mentor_attendance === false ? 'Mentor was absent' : 'Student was absent';
    }
    return 'Revision AND/OR Reschedule Needed';
  }
  return DISPLAY_STATUS[raw] ?? 'Scheduled';
};

const resolveCanJoin = (event: ApiMentoringEvent, status: AppointmentStatus, meetUrl: string | null) => {
  if (event.can_join != null) {
    return Boolean(event.can_join && meetUrl);
  }
  if (status !== 'Scheduled' || !meetUrl || !event.start_time) {
    return false;
  }
  const start = new Date(event.start_time).getTime();
  const end = event.end_time ? new Date(event.end_time).getTime() : start + (60 * 60 * 1000);
  const now = Date.now();
  return now >= (start - (15 * 60 * 1000)) && now <= end;
};

export const mapMentoringEventToAppointment = (event: ApiMentoringEvent): AppointmentRecord => {
  const guests = Array.isArray(event.guests) ? event.guests : [];
  const mentorFromField = typeof event.mentor === 'string'
    ? event.mentor
    : (event.mentor?.full_name || event.mentor?.name || '');
  const mentorGuest = guests.find((guest) => (
    guest.is_mentor === true
    || guest.role === 'mentor'
    || guest.id === event.organiser_id
  ));
  const studentGuest = guests.find((guest) => (
    guest !== mentorGuest
    && guest.is_mentor !== true
    && guest.role !== 'mentor'
    && guest.id !== event.organiser_id
  )) || guests.find((guest) => guest !== mentorGuest);

  const course = resolveCourse(event);
  const status = resolveStatus(event);
  const meetUrl = resolveMeetUrl(event);
  const invoiceRaw = (event.invoice_type || '').toUpperCase();

  let studentAttendance: Attendance = null;
  if (event.student_attendance === true) {
    studentAttendance = 'Present';
  } else if (event.student_attendance === false) {
    studentAttendance = 'Absent';
  }

  let mentorAttendance: Attendance = null;
  if (event.mentor_attendance === true) {
    mentorAttendance = 'Present';
  } else if (event.mentor_attendance === false) {
    mentorAttendance = 'Absent';
  }

  return {
    id: String(event.id ?? `${event.start_time}-${event.event_name}`),
    title: event.event_name || event.title || event.name || 'Appointment',
    courseCode: course.code,
    courseName: course.name,
    date: formatDay(event.start_time),
    start: formatClock(event.start_time),
    end: formatClock(event.end_time),
    status,
    meetUrl,
    canJoin: resolveCanJoin(event, status, meetUrl),
    studentName: personName(studentGuest),
    studentAttendance,
    agenda: event.agenda || event.description || '',
    mentorName: event.organiser_name || mentorFromField || personName(mentorGuest),
    mentorAttendance,
    mentorComments: '',
    invoiceType: invoiceRaw === 'MAF' || invoiceRaw === 'AI' ? invoiceRaw : null,
    invoiceAmount: event.calculated_amount ?? null,
    statusDetail: event.failure_reason || null,
  };
};

