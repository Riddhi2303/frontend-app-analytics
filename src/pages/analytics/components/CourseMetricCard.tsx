import type { KeyboardEvent, MouseEvent } from 'react';

import type { CourseMetric } from '../data/analyticsData';
import { CourseMetricInfoButton } from './CourseMetricInfoTooltip';

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

export type CourseMetricCardProps = {
  metric: CourseMetric | null | undefined;
  courseCode?: string;
  showInfoTooltip?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
};

const CourseMetricCard = ({
  metric,
  courseCode,
  showInfoTooltip = false,
  onClick,
  className = '',
}: CourseMetricCardProps) => {
  const tone = inferTone(metric);
  const labeledClass = courseCode ? 'metric-card--labeled' : '';
  const cardClassName = [className, labeledClass].filter(Boolean).join(' ');
  const courseLabel = courseCode ?? metric?.courseCode ?? 'course';
  const hasInfoTooltip = Boolean(showInfoTooltip && metric && tone !== 'empty');

  const courseCodeLabel = courseCode ? (
    <div className={`metric-course-code metric-course-code--${tone}`}>{courseCode}</div>
  ) : null;

  const handleActivate = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('.metric-info-wrap')) {
      return;
    }
    onClick?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event as unknown as MouseEvent<HTMLElement>);
    }
  };

  const interactiveProps = onClick ? {
    onClick: handleActivate,
    onKeyDown: handleKeyDown,
    role: 'button' as const,
    tabIndex: 0,
  } : {};

  let card: JSX.Element;

  if (tone === 'empty') {
    card = (
      <div className={`metric-card empty ${cardClassName}`.trim()} aria-label="No data">
        {courseCodeLabel}
      </div>
    );
  } else if (tone === 'neutral') {
    const m = metric!;
    card = (
      <div className={`metric-card neutral ${cardClassName}`.trim()} {...interactiveProps}>
        {courseCodeLabel}
        <div className="metric-bottom metric-bottom--status">Not Started</div>
        {m.mentor && m.mentor !== '-' && (
          <div className="metric-bottom">{m.mentor}</div>
        )}
      </div>
    );
  } else {
    const showTriple = tone === 'accent';
    const m = metric!;

    card = (
      <div className={`metric-card ${tone} ${cardClassName}`.trim()} {...interactiveProps}>
        {courseCodeLabel}
        <div className="metric-top">
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
  }

  if (onClick && tone === 'empty') {
    return (
      <button
        type="button"
        className="metric-cell-button"
        onClick={onClick}
      >
        {card}
      </button>
    );
  }

  if (hasInfoTooltip || onClick) {
    return (
      <div className={[
        'metric-cell-interactive',
        hasInfoTooltip ? 'metric-cell-interactive--with-info' : '',
      ].filter(Boolean).join(' ')}>
        {card}
        {hasInfoTooltip && (
          <CourseMetricInfoButton metric={metric!} courseLabel={courseLabel} />
        )}
      </div>
    );
  }

  return card;
};

export default CourseMetricCard;
