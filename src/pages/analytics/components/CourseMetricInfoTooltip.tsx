import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import type { CourseMetric } from '../data/analyticsData';

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M11.8 10.1 10.4 11.5c-.3.3-.8.4-1.2.2-1.8-.8-3.9-2.9-4.7-4.7-.2-.4-.1-.9.2-1.2L6.1 4.4c-.2-.2.2-.6 0-.9L4.1 1.3a.7.7 0 0 0-1 0L1.8 2.6c-.8.8-1 2-.5 3.1 1 2.3 2.7 4.8 5 7.1 2.3 2.3 4.8 4 7.1 5 .1.1.3.1.5.1.9 0 1.8-.3 2.5-1l1.3-1.3a.7.7 0 0 0 0-1l-2.2-2.2a.6.6 0 0 0-.9 0Z"
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

const SummaryPersonLine = ({ label, name }: { label: string; name: string }) => (
  <p className="metric-info-person-line">
    <span className="metric-info-person-label">{label}:</span>
    {' '}
    <span className="metric-info-person-name">{name}</span>
  </p>
);

type MetricInfoTooltipContentProps = {
  metric: CourseMetric;
  studentName?: string;
};

const MetricInfoTooltipContent = ({ metric, studentName }: MetricInfoTooltipContentProps) => {
  const mentorName = metric.mentor && metric.mentor !== '-' ? metric.mentor : 'No mentor assigned';
  const learnerName = studentName?.trim() || '—';
  const showCalls = metric.gateTotal > 0 || metric.gateCompleted > 0 || metric.gateScheduled > 0;
  const showPractice = metric.oraTotal > 0;
  const showPoints = metric.oraTotal > 0 && metric.oraPointsTotal > 0;

  return (
    <>
      <div className="metric-info-tooltip-section metric-info-tooltip-section--summary">
        <span className="metric-info-tooltip-label">Summary</span>
        <strong className="metric-info-tooltip-title">{metric.courseName}</strong>
        <SummaryPersonLine label="Learner" name={learnerName} />
        <SummaryPersonLine label="Mentor" name={mentorName} />
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
    </>
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

const VIEWPORT_MARGIN = 8;
const TOOLTIP_GAP = 8;

const computeTooltipPosition = (
  anchorRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorRect.right + TOOLTIP_GAP;
  if (left + tooltipWidth > viewportWidth - VIEWPORT_MARGIN) {
    left = anchorRect.left - tooltipWidth - TOOLTIP_GAP;
  }
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - tooltipWidth - VIEWPORT_MARGIN));

  const spaceBelow = viewportHeight - anchorRect.bottom;
  const centeredTop = anchorRect.top + (anchorRect.height - tooltipHeight) / 2;
  const belowTop = anchorRect.bottom + TOOLTIP_GAP;
  const aboveTop = anchorRect.top - tooltipHeight - TOOLTIP_GAP;

  let top = centeredTop;
  const fitsCentered = centeredTop + tooltipHeight <= viewportHeight - VIEWPORT_MARGIN
    && centeredTop >= VIEWPORT_MARGIN;
  const fitsBelow = belowTop + tooltipHeight <= viewportHeight - VIEWPORT_MARGIN;
  const fitsAbove = aboveTop >= VIEWPORT_MARGIN;

  if (!fitsCentered && spaceBelow < tooltipHeight + TOOLTIP_GAP && fitsAbove) {
    top = aboveTop;
  } else if (!fitsCentered && fitsBelow) {
    top = belowTop;
  } else if (!fitsCentered && fitsAbove) {
    top = aboveTop;
  }

  top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewportHeight - tooltipHeight - VIEWPORT_MARGIN));

  return { top, left };
};

type CourseMetricInfoButtonProps = {
  metric: CourseMetric;
  courseLabel: string;
  studentName?: string;
  onTileClick?: (event: MouseEvent<HTMLElement>) => void;
};

export const CourseMetricInfoButton = ({
  metric,
  courseLabel,
  studentName,
  onTileClick,
}: CourseMetricInfoButtonProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!isHovered) {
      setIsPlaced(false);
      setTooltipStyle(null);
      return;
    }

    const wrap = wrapRef.current;
    const tooltip = tooltipRef.current;
    if (!wrap || !tooltip) {
      return;
    }

    const anchorRect = wrap.getBoundingClientRect();
    const { top, left } = computeTooltipPosition(
      anchorRect,
      tooltip.offsetWidth,
      tooltip.offsetHeight,
    );
    setTooltipStyle({ top, left });
    setIsPlaced(true);
  }, [isHovered, metric, studentName]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onTileClick?.(event);
  }, [onTileClick]);

  const tooltipClassName = [
    'metric-info-tooltip',
    'metric-info-tooltip--fixed',
    isHovered ? 'metric-info-tooltip--visible' : '',
    isPlaced ? 'metric-info-tooltip--placed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapRef}
      className="metric-info-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="metric-info-btn"
        tabIndex={-1}
        aria-label={`Summary for ${courseLabel}`}
        onClick={handleClick}
      >
        <InfoIcon />
      </button>
      {createPortal(
        <div
          className={tooltipClassName}
          ref={tooltipRef}
          style={tooltipStyle ?? undefined}
          role="tooltip"
          aria-hidden={!isHovered}
        >
          <MetricInfoTooltipContent metric={metric} studentName={studentName} />
        </div>,
        document.body,
      )}
    </div>
  );
};

const CourseMetricInfoTooltip = MetricInfoTooltipContent;

export default CourseMetricInfoTooltip;
