import type { ElementType, MouseEvent } from 'react';

import type { StudentRecord } from '../data/analyticsData';
import CourseMetricCard from './CourseMetricCard';

type StudentMetricsRowContentProps = {
  student: StudentRecord;
  courseCodes: string[];
  showInfoTooltip?: boolean;
  onCourseClick?: (courseCode: string) => (event: MouseEvent<HTMLElement>) => void;
  cellElement?: ElementType;
};

const StudentMetricsRowContent = ({
  student,
  courseCodes,
  showInfoTooltip = false,
  onCourseClick,
  cellElement: Cell = 'td',
}: StudentMetricsRowContentProps) => (
  <>
    <Cell className="ongoing-cell col-ongoing">
      {student.ongoingCourses.map((entry) => (
        <div key={entry.code} className="ongoing-entry">
          <span className="ongoing-dot" aria-hidden="true" />
          <strong>{entry.code}</strong>
        </div>
      ))}
    </Cell>
    <Cell className="call-cell col-last-call">
      {student.ongoingCourses.map((entry) => (
        <div key={entry.code} className="call-entry">{entry.lastCall}</div>
      ))}
    </Cell>
    <Cell className="call-cell col-next-call">
      {student.ongoingCourses.map((entry) => (
        <div key={entry.code} className="call-entry">{entry.nextCall}</div>
      ))}
    </Cell>
    {courseCodes.map((code) => (
      <Cell key={code} className="metric-cell col-course">
        <CourseMetricCard
          metric={student.courseMetrics[code] ?? null}
          studentName={student.name}
          showInfoTooltip={showInfoTooltip}
          onClick={onCourseClick?.(code)}
        />
      </Cell>
    ))}
  </>
);

export default StudentMetricsRowContent;
