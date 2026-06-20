import RefreshCwIcon from './RefreshCwIcon';
import SpinnerIcon from './SpinnerIcon';

type AnalyticsFiltersRowProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  selectedReadiness: 'all' | 'not-ready' | 'ready' | 'inactive';
  onReadinessChange: (value: 'all' | 'not-ready' | 'ready' | 'inactive') => void;
  countsLoading?: {
    all?: boolean;
    notReady?: boolean;
    ready?: boolean;
    inactive?: boolean;
  };
  countsHasValue?: {
    all?: boolean;
    notReady?: boolean;
    ready?: boolean;
    inactive?: boolean;
  };
  counts: {
    all: number;
    notReady: number;
    ready: number;
    inactive: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
  };
  onPageChange: (page: number) => void;
};

const ChipRadioIcon = ({ active }: { active: boolean }) => (
  active ? <span className="chip-dot chip-dot--on" aria-hidden="true" /> : <span className="chip-ring" aria-hidden="true" />
);

const AnalyticsFiltersRow = ({
  searchValue,
  onSearchChange,
  onRefresh,
  selectedReadiness,
  onReadinessChange,
  countsLoading = {},
  countsHasValue = {},
  counts,
  pagination,
  onPageChange,
}: AnalyticsFiltersRowProps) => {
  const chipLoadingKey: Record<
    'all' | 'not-ready' | 'ready' | 'inactive',
    keyof NonNullable<AnalyticsFiltersRowProps['countsLoading']>
  > = {
    all: 'all',
    'not-ready': 'notReady',
    ready: 'ready',
    inactive: 'inactive',
  };
  const { currentPage, totalPages, pageSize, totalCount } = pagination;
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  const chips: Array<{
    id: 'all' | 'not-ready' | 'ready' | 'inactive';
    label: string;
    count: number;
    warn?: boolean;
  }> = [
    { id: 'all', label: 'All Students', count: counts.all },
    { id: 'not-ready', label: 'Not Ready for Residency', count: counts.notReady },
    { id: 'ready', label: 'Ready for Residency', count: counts.ready },
    { id: 'inactive', label: 'Inactive for 2 weeks +', count: counts.inactive, warn: true },
  ];

  return (
    <section className="analytics-filters-row">
      <button
        type="button"
        className="filters-refresh"
        onClick={onRefresh}
        aria-label="Refresh students and counts for current filters"
      >
        <RefreshCwIcon />
      </button>

      <div className="analytics-filters-search">
        <div className="search-wrap">
          <input
            className="search-input"
            type="search"
            placeholder="Search Name"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            autoComplete="off"
          />
          <span className="search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.75" />
              <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>

      <div className="analytics-filters-chips-scroll">
        <div className="filter-chips">
          <span className="label">Showing:</span>
          {chips.map((chip) => {
            const isActive = selectedReadiness === chip.id;
            const loadingKey = chipLoadingKey[chip.id];
            const isLoading = Boolean(countsLoading[loadingKey]);
            const hasValue = countsHasValue[loadingKey] ?? chip.count > 0;
            return (
              <button
                key={chip.id}
                type="button"
                className={`chip ${isActive ? 'active' : ''} ${chip.warn ? 'chip--warn' : ''} ${isLoading ? 'chip--loading' : ''}`}
                onClick={() => onReadinessChange(chip.id)}
              >
                {isLoading && (
                  <span className="chip-leading-spinner" aria-label="Loading count">
                    <SpinnerIcon size={12} />
                  </span>
                )}
                <ChipRadioIcon active={isActive} />
                <span className="chip-label">{chip.label}</span>
                <span className="chip-count" aria-live="polite">
                  {(!isLoading || hasValue) && `(${chip.count})`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pagination-block">
        <span className="pagination-range">
          {rangeStart}-{rangeEnd} of {totalCount}
        </span>
        <button
          type="button"
          className="pager-nav pager-nav--icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className="pager-nav pager-nav--icon"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default AnalyticsFiltersRow;
