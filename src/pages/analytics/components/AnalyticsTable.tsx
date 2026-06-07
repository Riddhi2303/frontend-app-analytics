import { CourseMetric, StudentRecord } from '../data/analyticsData';

type AnalyticsTableProps = {
  students: StudentRecord[];
  courseCodes: string[];
  loading?: boolean;
};

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M11.8 10.1 10.4 11.5c-.3.3-.8.4-1.2.2-1.8-.8-3.9-2.9-4.7-4.7-.2-.4-.1-.9.2-1.2L6.1 4.4c.2-.2.2-.6 0-.9L4.1 1.3a.7.7 0 0 0-1 0L1.8 2.6c-.8.8-1 2-.5 3.1 1 2.3 2.7 4.8 5 7.1 2.3 2.3 4.8 4 7.1 5 .1.1.3.1.5.1.9 0 1.8-.3 2.5-1l1.3-1.3a.7.7 0 0 0 0-1l-2.2-2.2a.6.6 0 0 0-.9 0Z"
      fill="currentColor"
    />
  </svg>
);

const ChecklistIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M2.5 1.5h8.8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm0 1v11h8.8v-11H2.5Zm2.1 2.1h4.8v1H4.6v-1Zm0 3h4.8v1H4.6v-1Zm0 3h4.8v1H4.6v-1Zm-1.3-6 .8.8 1.4-1.5.7.7L4.1 6.5 2.6 5l.7-.7Zm0 3 .8.8 1.4-1.5.7.7-2.1 2.2L2.6 8l.7-.7Zm0 3 .8.8 1.4-1.5.7.7-2.1 2.2-1.5-1.5.7-.7Z"
      fill="currentColor"
    />
  </svg>
);

const GemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M3.2 2.2h9.6l2.1 3.2-6.9 8.3L1.1 5.4l2.1-3.2Zm.5 1L2.4 5.1 8 11.8l5.6-6.7-1.3-1.9H3.7Zm2.1 0L4.8 5.1H7L8 3.2H5.8Zm4.4 0L9 5.1h2.2l-1-1.9Zm-2.1.2L6.9 5.1h2.2L8.1 3.4Z"
      fill="currentColor"
    />
  </svg>
);

type MetricTone = 'success' | 'accent' | 'neutral' | 'empty';

const inferTone = (metric: CourseMetric | null | undefined): MetricTone => {
  if (!metric) { return 'empty'; }
  const hasMentor = Boolean(metric.mentor && metric.mentor !== '-');
  const isOraless = metric.oraTotal === 0;
  const hasActivity = metric.gateCompleted > 0 || metric.gateScheduled > 0 || metric.oraGraded > 0 || metric.oraSubmitted > 0;
  if (!hasActivity && !hasMentor && metric.gateTotal === 0) { return 'empty'; }
  if (metric.gateCompleted === 0 && metric.gateScheduled === 0 && metric.oraGraded === 0 && metric.oraSubmitted === 0) { return 'neutral'; }
  const gateComplete = metric.gateTotal > 0 && metric.gateCompleted >= metric.gateTotal;
  if (isOraless && gateComplete) { return 'success'; }
  const oraPassingGrade = metric.oraPointsTotal > 0 && metric.passingGradePercentage > 0
    && (metric.oraPointsObtained / metric.oraPointsTotal) >= metric.passingGradePercentage;
  if (!isOraless && oraPassingGrade) { return 'success'; }
  return 'accent';
};

const metricCard = (metric: CourseMetric | null | undefined) => {
  const tone = inferTone(metric);

  if (tone === 'empty') {
    return <div className="metric-card empty" aria-label="No data" />;
  }

  if (tone === 'neutral') {
    return (
      <div className="metric-card neutral">
        <div className="metric-bottom metric-bottom--status">Not Started</div>
        {metric!.mentor && metric!.mentor !== '-' && (
          <div className="metric-bottom">{metric!.mentor}</div>
        )}
      </div>
    );
  }

  const showTriple = tone === 'accent';
  const m = metric!;

  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-top">
        {/* Gate calls */}
        <span className="metric-pill">
          <PhoneIcon />
          {showTriple ? (
            <span className="metric-triple">
              <span className="metric-num metric-num--green">{m.gateCompleted}</span>
              <span className="metric-dot-sep">·</span>
              <span className="metric-num metric-num--blue">{m.gateScheduled}</span>
              <span className="metric-dot-sep">·</span>
              <span className="metric-num metric-num--muted">{m.gateTotal}</span>
            </span>
          ) : (
            <strong className="metric-single">{m.gateCompleted}</strong>
          )}
        </span>

        {/* ORA tasks — hidden when course has no ORA assignments */}
        {m.oraTotal > 0 && (
          <span className="metric-pill">
            <ChecklistIcon />
            {showTriple ? (
              <span className="metric-triple">
                <span className="metric-num metric-num--green">{m.oraSubmitted}</span>
                <span className="metric-dot-sep">·</span>
                <span className="metric-num metric-num--blue">{m.oraGraded}</span>
                <span className="metric-dot-sep">·</span>
                <span className="metric-num metric-num--muted">{m.oraTotal}</span>
              </span>
            ) : (
              <strong className="metric-single">{m.oraSubmitted}</strong>
            )}
          </span>
        )}

        {/* ORA points — hidden when course has no ORA assignments */}
        {m.oraTotal > 0 && (
          <span className="metric-pill metric-pill--gem">
            <GemIcon />
            <span className="metric-fraction">
              <strong>{m.oraPointsObtained}</strong>
              <span className="metric-fraction-denom">/{m.oraPointsTotal || '-'}</span>
            </span>
          </span>
        )}
      </div>

      {m.mentor && m.mentor !== '-' ? (
        <div className="metric-bottom">{m.mentor}</div>
      ) : (
        <div className="metric-bottom metric-bottom--muted">No Mentor</div>
      )}
    </div>
  );
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

const AnalyticsTable = ({ students, courseCodes, loading = false }: AnalyticsTableProps) => (
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
                {loading ? 'Loading…' : 'No students match selected filters.'}
              </td>
            </tr>
          ) : students.map((student) => {
            const hasResidency = student.residency === 'Assigned';
            return (
              <tr key={student.id} className={student.readiness === 'ready' ? 'highlighted' : ''}>
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
                    {metricCard(student.courseMetrics[code] ?? null)}
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
