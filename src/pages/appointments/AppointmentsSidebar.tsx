import { ChevronRightIcon } from './AppointmentsIcons';
import { formatInr, formatUsername, type AppointmentCourseOption } from './appointmentsData';

type AppointmentsSidebarProps = {
  mentors: string[];
  students: string[];
  months: string[];
  courses: AppointmentCourseOption[];
  selectedMentor: string;
  selectedStudent: string;
  selectedMonth: string;
  selectedCourse: string;
  totalAiInvoice: number | null;
  totalMafInvoice: number | null;
  onMentorChange: (value: string) => void;
  onStudentChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onMentorStep: (delta: number) => void;
  onMonthStep: (delta: number) => void;
};

const SelectRow = ({
  label,
  value,
  options,
  formatOption = (option: string) => option,
  onChange,
  onStep,
}: {
  label: string;
  value: string;
  options: string[];
  formatOption?: (option: string) => string;
  onChange: (value: string) => void;
  onStep?: (delta: number) => void;
}) => (
  <div className="appt-sidebar-block">
    <h3 className="sidebar-section-title">{label}</h3>
    <div className={`appt-sidebar-control${onStep ? '' : ' appt-sidebar-control--full'}`}>
      <div className="appt-sidebar-select-wrap">
        <select
          className="appt-sidebar-select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>{formatOption(option)}</option>
          ))}
        </select>
        <ChevronRightIcon className="appt-sidebar-caret" />
      </div>
      {onStep && (
        <div className="appt-sidebar-stepper">
          <button
            type="button"
            className="appt-sidebar-step"
            aria-label={`Previous ${label}`}
            onClick={() => onStep(-1)}
          >
            <ChevronRightIcon className="appt-step-icon appt-step-icon--prev" />
          </button>
          <button
            type="button"
            className="appt-sidebar-step"
            aria-label={`Next ${label}`}
            onClick={() => onStep(1)}
          >
            <ChevronRightIcon className="appt-step-icon" />
          </button>
        </div>
      )}
    </div>
  </div>
);

const AppointmentsSidebar = ({
  mentors,
  students,
  months,
  courses,
  selectedMentor,
  selectedStudent,
  selectedMonth,
  selectedCourse,
  totalAiInvoice,
  totalMafInvoice,
  onMentorChange,
  onStudentChange,
  onMonthChange,
  onCourseChange,
  onMentorStep,
  onMonthStep,
}: AppointmentsSidebarProps) => (
  <aside className="analytics-sidebar appointments-sidebar">
    <SelectRow
      label="Month"
      value={selectedMonth}
      options={['All Months', ...months]}
      onChange={onMonthChange}
      onStep={onMonthStep}
    />
    <SelectRow
      label="Mentor"
      value={selectedMentor}
      options={['All Mentors', ...mentors]}
      formatOption={(option) => (option === 'All Mentors' ? option : formatUsername(option))}
      onChange={onMentorChange}
      onStep={onMentorStep}
    />

    {totalAiInvoice !== null && (
      <div className="appt-invoice-stat">
        <span className="appt-invoice-label">Total AI Invoice :</span>
        <span className="appt-invoice-value">{formatInr(totalAiInvoice)}</span>
      </div>
    )}
    {totalMafInvoice !== null && (
      <div className="appt-invoice-stat">
        <span className="appt-invoice-label">Total MAF Invoice:</span>
        <span className="appt-invoice-value">{formatInr(totalMafInvoice)}</span>
      </div>
    )}

    <SelectRow
      label="Student"
      value={selectedStudent}
      options={['All Students', ...students]}
      formatOption={(option) => (option === 'All Students' ? option : formatUsername(option))}
      onChange={onStudentChange}
    />

    <h3 className="sidebar-section-title">Course</h3>
    <div className="filter-list">
      {courses.map((course) => (
        <label key={course.code} className="filter-row">
          <input
            type="radio"
            name="appt-course"
            className="filter-radio"
            checked={selectedCourse === course.code}
            onChange={() => onCourseChange(course.code)}
          />
          <span className="filter-label">{course.name}</span>
        </label>
      ))}
    </div>
  </aside>
);

export default AppointmentsSidebar;
