import type { MouseEvent } from 'react';
import { StudentRecord } from '../data/analyticsData';
import CourseMetricCard from './CourseMetricCard';
import SpinnerIcon from './SpinnerIcon';

type AnalyticsTableProps = {
  students: StudentRecord[];
  courseCodes: string[];
  loading?: boolean;
  selectedStudentId?: number | null;
  onStudentSelect?: (studentId: number, courseCode?: string) => void;
};

const initialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) { return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase(); }
  return name.slice(0, 2).toUpperCase() || '?';
};

const COURSE_DOT_CLASS: Record<string, string> = {
  CAD1: 'ongoing-dot--primary',
  EMC1: 'ongoing-dot--secondary',
};

const dotClassForCourse = (code: string) => COURSE_DOT_CLASS[code.toUpperCase()] ?? 'ongoing-dot--tertiary';

const totalColCount = (courseCodes: string[]) => 4 + courseCodes.length;

const AnalyticsTable = ({
  students,
  courseCodes,
  loading = false,
  selectedStudentId = null,
  onStudentSelect,
}: AnalyticsTableProps) => (
  <div className="analytics-table-wrap">
    <div className="analytics-grid-canvas">
      <table className="analytics-table">
        <colgroup>
          <col className="col-name" />
          <col className="col-ongoing" />
          <col className="col-last-call" />
          <col className="col-next-call" />
          {courseCodes.map((code) => (
            <col key={code} className="col-course" />
          ))}
        </colgroup>
        <thead>
          <tr className="thead-levels">
            <th className="th-level-gap col-sticky" aria-hidden="true" />
            <th colSpan={3} className="th-level-gap" aria-hidden="true" />
            {courseCodes.length > 0 && (
              <th colSpan={courseCodes.length} className="th-level th-level--1">Courses</th>
            )}
          </tr>
          <tr className="thead-labels">
            <th className="col-sticky">Name</th>
            <th>Ongoing</th>
            <th>Last Call</th>
            <th>Next Call</th>
            {courseCodes.map((code) => (
              <th key={code}>{code}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={totalColCount(courseCodes)} className="empty-row">
                {loading ? <SpinnerIcon size={20} /> : 'No students match selected filters.'}
              </td>
            </tr>
          ) : students.map((student) => {
            const hasResidency = student.residency === 'Assigned';
            const isSelected = selectedStudentId === student.id;
            const rowClassNames = [
              student.readiness === 'ready' ? 'highlighted' : '',
              isSelected ? 'selected' : '',
              onStudentSelect ? 'clickable' : '',
            ].filter(Boolean).join(' ');

            const handleRowActivate = () => {
              onStudentSelect?.(student.id);
            };

            const handleCourseActivate = (courseCode: string) => (event: MouseEvent) => {
              event.stopPropagation();
              onStudentSelect?.(student.id, courseCode);
            };

            return (
              <tr
                key={student.id}
                className={rowClassNames}
                onClick={onStudentSelect ? handleRowActivate : undefined}
                onKeyDown={onStudentSelect ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleRowActivate();
                  }
                } : undefined}
                tabIndex={onStudentSelect ? 0 : undefined}
                aria-selected={onStudentSelect ? isSelected : undefined}
              >
                <td className="student-cell">
                  <div className="student-cell-inner">
                    <span className="student-avatar" aria-hidden="true">
                      {initialsFromName(student.name)}
                    </span>
                    <div className="student-text">
                      <strong>{student.name}</strong>
                      {hasResidency ? (
                        <div className="student-cohort">{student.cohort}</div>
                      ) : (
                        <p className="assign-residency-link">Assign Residency</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="ongoing-cell">
                  {student.ongoingCourses.map((entry) => (
                    <div key={entry.code} className="ongoing-entry">
                      <span className={`ongoing-dot ${dotClassForCourse(entry.code)}`} aria-hidden="true" />
                      <strong>{entry.code}</strong>
                    </div>
                  ))}
                </td>
                <td className="call-cell">
                  {student.ongoingCourses.map((entry) => (
                    <div key={entry.code} className="call-entry">{entry.lastCall}</div>
                  ))}
                </td>
                <td className="call-cell">
                  {student.ongoingCourses.map((entry) => (
                    <div key={entry.code} className="call-entry">{entry.nextCall}</div>
                  ))}
                </td>
                {courseCodes.map((code) => (
                  <td key={code} className="metric-cell">
                    <CourseMetricCard
                      metric={student.courseMetrics[code] ?? null}
                      showInfoTooltip
                      onClick={onStudentSelect ? handleCourseActivate(code) : undefined}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default AnalyticsTable;
