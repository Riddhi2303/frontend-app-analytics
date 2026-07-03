import { useMemo } from 'react';

import {
  collectCourseCodes,
  formatResidencyRange,
  mapStudentsFromApi,
  studentDisplayName,
} from '../data/analyticsData';
import type { ApiStudent } from '../data/analyticsData';
import StudentMetricsRowContent from './StudentMetricsRowContent';
import { initialsFromName } from './studentMetricsShared';

type StudentOverviewBarProps = {
  student: ApiStudent;
};

const StudentOverviewBar = ({ student }: StudentOverviewBarProps) => {
  const studentRecord = useMemo(() => mapStudentsFromApi([student])[0], [student]);
  const courseCodes = useMemo(() => collectCourseCodes([student]), [student]);
  const residencyRange = formatResidencyRange(
    student.residency.start_date,
    student.residency.end_date,
  );
  const hasResidency = studentRecord.residency === 'Assigned';
  const isHighlighted = studentRecord.readiness === 'ready';

  const rowClassName = [
    'student-overview-row',
    isHighlighted ? 'highlighted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="student-overview-table">
      <div className="student-overview-head" aria-hidden="true">
        <div className="student-overview-head-cell col-name" />
        <div className="student-overview-head-cell col-ongoing">Ongoing</div>
        <div className="student-overview-head-cell col-last-call">Last Call</div>
        <div className="student-overview-head-cell col-next-call">Next Call</div>
        {courseCodes.map((code) => (
          <div key={code} className="student-overview-head-cell col-course">{code}</div>
        ))}
      </div>

      <div className={rowClassName}>
        <div className="student-cell">
          <div className="student-cell-inner">
            <span className="student-avatar" aria-hidden="true">
              {initialsFromName(studentRecord.name)}
            </span>
            <div className="student-text">
              <strong>{studentDisplayName(student)}</strong>
              {hasResidency ? (
                <div className="student-cohort">{student.residency.name}</div>
              ) : (
                <p className="assign-residency-link">Assign Residency</p>
              )}
              {residencyRange && (
                <p className="student-overview-dates">{residencyRange}</p>
              )}
            </div>
          </div>
        </div>

        <StudentMetricsRowContent
          student={studentRecord}
          courseCodes={courseCodes}
          showInfoTooltip
          cellElement="div"
        />
      </div>
    </div>
  );
};

export default StudentOverviewBar;
