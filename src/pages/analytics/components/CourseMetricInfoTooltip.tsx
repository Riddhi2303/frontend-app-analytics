import type { ReactNode } from 'react';

import type { CourseMetric } from '../data/analyticsData';

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

type MetricSummaryLineProps = {
  value: number;
  tone?: 'green' | 'blue';
  children: ReactNode;
};

const MetricSummaryLine = ({ value, tone = 'green', children }: MetricSummaryLineProps) => (
  <p className="metric-info-line">
    <strong className={`metric-info-line-value metric-info-line-value--${tone}`}>{value}</strong>
    {' '}
    {children}
  </p>
);

type CourseMetricInfoTooltipProps = {
  metric: CourseMetric;
};

const CourseMetricInfoTooltip = ({ metric }: CourseMetricInfoTooltipProps) => {
  const mentorLabel = metric.mentor && metric.mentor !== '-' ? metric.mentor : 'No mentor assigned';
  const showCalls = metric.gateTotal > 0 || metric.gateCompleted > 0 || metric.gateScheduled > 0;
  const showPractice = metric.oraTotal > 0;
  const showPoints = metric.oraTotal > 0 && metric.oraPointsTotal > 0;

  return (
    <div className="metric-info-tooltip" role="tooltip">
      <div className="metric-info-tooltip-section metric-info-tooltip-section--summary">
        <span className="metric-info-tooltip-label">Summary</span>
        <strong className="metric-info-tooltip-title">{metric.courseName}</strong>
        <p className="metric-info-tooltip-subtitle">{mentorLabel}</p>
      </div>

      {showCalls && (
        <div className="metric-info-tooltip-section">
          <div className="metric-info-tooltip-heading">
            <PhoneIcon />
            <strong>Calls</strong>
          </div>
          {metric.gateTotal > 0 && (
            <MetricSummaryLine value={metric.gateCompleted}>
              of
              {' '}
              {metric.gateTotal}
              {' '}
              calls have been completed
            </MetricSummaryLine>
          )}
          {metric.gateScheduled > 0 && (
            <MetricSummaryLine value={metric.gateScheduled} tone="blue">
              {metric.gateScheduled === 1 ? 'call is' : 'calls are'}
              {' '}
              scheduled with mentor
            </MetricSummaryLine>
          )}
        </div>
      )}

      {showPractice && (
        <div className="metric-info-tooltip-section">
          <div className="metric-info-tooltip-heading">
            <ChecklistIcon />
            <strong>Practice</strong>
          </div>
          <MetricSummaryLine value={metric.oraSubmitted}>
            of
            {' '}
            {metric.oraTotal}
            {' '}
            {metric.oraTotal === 1 ? 'response has' : 'responses have'}
            {' '}
            been submitted
          </MetricSummaryLine>
          {metric.oraGraded > 0 && (
            <MetricSummaryLine value={metric.oraGraded} tone="blue">
              {metric.oraGraded === 1 ? 'response is' : 'responses are'}
              {' '}
              reviewed by mentor
            </MetricSummaryLine>
          )}
        </div>
      )}

      {showPoints && (
        <div className="metric-info-tooltip-section">
          <div className="metric-info-tooltip-heading">
            <GemIcon />
            <strong>Points</strong>
          </div>
          <MetricSummaryLine value={metric.oraPointsObtained}>
            out of
            {' '}
            {metric.oraPointsTotal}
            {' '}
            points have obtained till now
          </MetricSummaryLine>
        </div>
      )}
    </div>
  );
};

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <circle cx="7" cy="7" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M7 6.1V9.6M7 4.4h.01"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

type CourseMetricInfoButtonProps = {
  metric: CourseMetric;
  courseLabel: string;
};

export const CourseMetricInfoButton = ({ metric, courseLabel }: CourseMetricInfoButtonProps) => (
  <div className="metric-info-wrap">
    <button
      type="button"
      className="metric-info-btn"
      aria-label={`Summary for ${courseLabel}`}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <InfoIcon />
    </button>
    <CourseMetricInfoTooltip metric={metric} />
  </div>
);

export default CourseMetricInfoTooltip;
