import { CopyIcon, VideoIcon } from './AppointmentsIcons';
import type { AppointmentRecord } from './appointmentsData';
import { statusClassName } from './appointmentsData';

type AppointmentsTableProps = {
  appointments: AppointmentRecord[];
  onCancel: (id: string) => void;
};

const CANCELLABLE_STATUSES: AppointmentRecord['status'][] = ['Scheduled', 'Pending', 'Not Booked'];

const PresentIcon = () => (
  <svg className="appt-icon" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <circle cx="7" cy="7" r="7" fill="#037e53" />
    <path
      d="M3.9 7.15 6.05 9.25 10.15 4.6"
      fill="none"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AbsentIcon = () => (
  <svg className="appt-icon" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <circle cx="7" cy="7" r="7" fill="#e30909" />
    <path
      d="M4.6 4.6 9.4 9.4M9.4 4.6 4.6 9.4"
      fill="none"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const AttendanceMark = ({ value }: { value: AppointmentRecord['studentAttendance'] }) => {
  if (value === 'Present') {
    return (
      <span className="appt-attend appt-attend--present">
        <PresentIcon />
        Present
      </span>
    );
  }
  if (value === 'Absent') {
    return (
      <span className="appt-attend appt-attend--absent">
        <AbsentIcon />
        Absent
      </span>
    );
  }
  return null;
};

const DateTimeCell = ({
  date,
  start,
  end,
}: {
  date: string;
  start: string;
  end: string;
}) => {
  const dateMatch = date.match(/^(\d{1,2}\s[A-Za-z]{3})(\s\d{4})$/);
  return (
    <>
      <div className="appt-date">
        {dateMatch ? (
          <>
            <strong>{dateMatch[1]}</strong>
            {dateMatch[2]}
          </>
        ) : date}
      </div>
      <div className="appt-time">
        <strong>{start}</strong>
        {` - ${end}`}
      </div>
    </>
  );
};

const StatusCell = ({ appointment }: { appointment: AppointmentRecord }) => {
  const copyUrl = async () => {
    if (!appointment.meetUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(appointment.meetUrl);
    } catch {
      // Ignore clipboard errors in unsupported browsers.
    }
  };

  const showJoinAction = appointment.canJoin && Boolean(appointment.meetUrl);
  const showCopy = Boolean(appointment.meetUrl);

  return (
    <div className="appt-status-cell">
      {showJoinAction ? (
        <a className="appt-join-btn" href={appointment.meetUrl!} target="_blank" rel="noreferrer">
          <VideoIcon className="appt-icon appt-icon--video" />
          Join call
        </a>
      ) : (
        <span className={`appt-status ${statusClassName(appointment.status)}`}>
          {appointment.status}
        </span>
      )}
      {showCopy && (
        <button type="button" className="appt-copy-link" onClick={copyUrl}>
          <CopyIcon className="appt-icon appt-icon--copy" />
          Copy call URL
        </button>
      )}
      {appointment.statusDetail && (
        <div className="appt-status-detail">{appointment.statusDetail}</div>
      )}
    </div>
  );
};

const AppointmentsTable = ({ appointments, onCancel }: AppointmentsTableProps) => (
  <div className="analytics-table-wrap appointments-table-wrap">
    <div className="analytics-grid-canvas">
      <table className="analytics-table appointments-table">
        <thead>
          <tr className="thead-labels">
            <th>Appointment</th>
            <th>Date &amp; Time</th>
            <th>Status</th>
            <th className="appt-th-people">Student /<br />Mentor</th>
            <th>Agenda</th>
            <th aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-row">
                No appointments match selected filters.
              </td>
            </tr>
          ) : appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>
                <div className="appt-title">{appointment.title}</div>
                <div className="appt-course">
                  {appointment.courseCode
                    ? `${appointment.courseName} (${appointment.courseCode})`
                    : appointment.courseName}
                </div>
              </td>
              <td>
                <DateTimeCell
                  date={appointment.date}
                  start={appointment.start}
                  end={appointment.end}
                />
              </td>
              <td>
                <StatusCell appointment={appointment} />
              </td>
              <td>
                <div className="appt-person-line">
                  <span className="appt-person appt-person--student">{appointment.studentName}</span>
                  <AttendanceMark value={appointment.studentAttendance} />
                </div>
                <div className="appt-person-line appt-person-line--mentor">
                  <span className="appt-person appt-person--mentor">{appointment.mentorName}</span>
                  <AttendanceMark value={appointment.mentorAttendance} />
                </div>
              </td>
              <td className="appt-agenda">{appointment.agenda}</td>
              <td className="appt-actions">
                {CANCELLABLE_STATUSES.includes(appointment.status) && (
                  <button
                    type="button"
                    className="appt-cancel-link"
                    onClick={() => onCancel(appointment.id)}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AppointmentsTable;
