import type { MouseEvent } from 'react';
import { StudentRecord } from '../data/analyticsData';
import SpinnerIcon from './SpinnerIcon';
import StudentMetricsRowContent from './StudentMetricsRowContent';
import { initialsFromName } from './studentMetricsShared';

type AnalyticsTableProps = {
  students: StudentRecord[];
  courseCodes: string[];
  loading?: boolean;
  selectedStudentId?: number | null;
  canAssignResidency?: boolean;
  onStudentSelect?: (studentId: number, courseCode?: string) => void;
};

const totalColCount = (courseCodes: string[]) => 4 + courseCodes.length;

const AnalyticsTable = ({
  students,
  courseCodes,
  loading = false,
  selectedStudentId = null,
  canAssignResidency = false,
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
            <th className="col-sticky col-name">Name</th>
            <th className="col-ongoing">Ongoing</th>
            <th className="col-last-call">Last Call</th>
            <th className="col-next-call">Next Call</th>
            {courseCodes.map((code) => (
              <th key={code} className="col-course">{code}</th>
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
                <td className="student-cell col-name">
                  <div className="student-cell-inner">
                    <span className="student-avatar" aria-hidden="true">
                      {initialsFromName(student.name)}
                    </span>
                    <div className="student-text">
                      <strong>{student.name}</strong>
                      {hasResidency ? (
                        <div className="student-cohort">{student.cohort}</div>
                      ) : canAssignResidency ? (
                        <p className="assign-residency-link">Assign Residency</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <StudentMetricsRowContent
                  student={student}
                  courseCodes={courseCodes}
                  showInfoTooltip
                  onCourseClick={onStudentSelect ? handleCourseActivate : undefined}
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default AnalyticsTable;
