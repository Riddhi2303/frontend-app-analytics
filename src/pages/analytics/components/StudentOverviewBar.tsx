import { useMemo } from 'react';

import {
  collectCourseCodes,
  formatResidencyRange,
  mapStudentsFromApi,
  studentDisplayName,
} from '../data/analyticsData';
import type { ApiStudent } from '../data/analyticsData';
import CourseMetricCard from './CourseMetricCard';

const COURSE_DOT_CLASS: Record<string, string> = {
  CAD1: 'ongoing-dot--primary',
  EMC1: 'ongoing-dot--secondary',
};

const dotClassForCourse = (code: string) => COURSE_DOT_CLASS[code.toUpperCase()] ?? 'ongoing-dot--tertiary';

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

  return (
    <div className="student-overview-bar">
      <div className="student-overview-identity">
        <h2>{studentDisplayName(student)}</h2>
        {student.residency.name && <p className="student-overview-cohort">{student.residency.name}</p>}
        {residencyRange && <p className="student-overview-dates">{residencyRange}</p>}
      </div>

      <div className="student-overview-calls" aria-label="Call schedule">
        <div className="student-overview-call-col">
          <span className="student-overview-call-label">Ongoing</span>
          {studentRecord.ongoingCourses.map((entry) => (
            <div key={entry.code} className="ongoing-entry">
              <span className={`ongoing-dot ${dotClassForCourse(entry.code)}`} aria-hidden="true" />
              <strong>{entry.code}</strong>
            </div>
          ))}
        </div>
        <div className="student-overview-call-col student-overview-call-col--center">
          <span className="student-overview-call-label">Last Call</span>
          {studentRecord.ongoingCourses.map((entry) => (
            <div key={entry.code} className="call-entry">{entry.lastCall}</div>
          ))}
        </div>
        <div className="student-overview-call-col student-overview-call-col--center">
          <span className="student-overview-call-label">Next Call</span>
          {studentRecord.ongoingCourses.map((entry) => (
            <div key={entry.code} className="call-entry">{entry.nextCall}</div>
          ))}
        </div>
      </div>

      <div className="student-overview-metrics" aria-label="Course progress">
        {courseCodes.map((code) => (
          <div key={code} className="student-overview-metric-col">
            <CourseMetricCard
              courseCode={code}
              metric={studentRecord.courseMetrics[code] ?? null}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentOverviewBar;
