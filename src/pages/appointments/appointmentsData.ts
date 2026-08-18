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
  { code: 'CAD1', name: 'Computer Aided Design (CAD1)' },
  { code: 'EMC1', name: 'Electronics & Microcontrollers (EMC1)' },
  { code: 'IOT1', name: 'Internet of Things (IoT1)' },
] as const;

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
  [...new Set(rows.map((row) => row.mentorName))].sort()
);

export const uniqueStudents = (rows: AppointmentRecord[]) => (
  [...new Set(rows.map((row) => row.studentName))].sort()
);

export const uniqueMonths = (rows: AppointmentRecord[]) => (
  [...new Set(rows.map((row) => row.date.replace(/^\d{2}\s/, '')))].sort()
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
