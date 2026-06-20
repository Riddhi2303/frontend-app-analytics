import { SIDEBAR_FILTER_KEY } from '../data/api';
import SpinnerIcon from './SpinnerIcon';
import { CohortRecord, FilterRecord, NOT_ASSIGNED_FILTER_LABEL } from '../data/analyticsData';

const SIDEBAR_RADIO_NAME = 'analytics-sidebar-filter';

const RowLoadingIndicator = ({ loading = false }: { loading?: boolean }) => (
  loading ? (
    <span className="filter-row-loading" aria-label="Loading count">
      <SpinnerIcon size={12} />
    </span>
  ) : null
);

type AnalyticsSidebarProps = {
  studentFilters: FilterRecord[];
  notAssignedFilter: FilterRecord;
  cohortFilters: CohortRecord[];
  selectedSidebarFilter: string;
  onSelectSidebarFilter: (filterKey: string) => void;
  enrollmentCountsLoading?: boolean;
  enrollmentCountsReady?: boolean;
  cohortCountsLoading?: boolean;
  cohortCountsReady?: boolean;
};

const FilterCount = ({
  count,
  loading = false,
  ready = false,
  danger = false,
}: {
  count: number;
  loading?: boolean;
  ready?: boolean;
  danger?: boolean;
}) => {
  if (!ready && loading) {
    return <span className={`filter-count ${danger ? 'danger' : ''}`} />;
  }

  return (
    <span className={`filter-count ${danger ? 'danger' : ''}`}>
      {`(${count})`}
    </span>
  );
};

const renderFilters = (
  filters: FilterRecord[],
  selectedSidebarFilter: string,
  onSelectSidebarFilter: (filterKey: string) => void,
  enrollmentCountsLoading?: boolean,
  enrollmentCountsReady?: boolean,
) => filters.map((item) => {
  const filterKey = SIDEBAR_FILTER_KEY.student(item.label);

  return (
    <label key={`student-${item.label}`} className="filter-row">
      <RowLoadingIndicator loading={enrollmentCountsLoading} />
      <input
        type="radio"
        name={SIDEBAR_RADIO_NAME}
        className={item.accent === 'yellow' ? 'filter-radio filter-radio--yellow' : 'filter-radio'}
        checked={selectedSidebarFilter === filterKey}
        onChange={() => onSelectSidebarFilter(filterKey)}
      />
      <span className="filter-label">{item.label}</span>
      <FilterCount
        count={item.count}
        loading={enrollmentCountsLoading}
        ready={enrollmentCountsReady}
        danger={item.accent === 'red'}
      />
    </label>
  );
});

const AnalyticsSidebar = ({
  studentFilters,
  notAssignedFilter,
  cohortFilters,
  selectedSidebarFilter,
  onSelectSidebarFilter,
  enrollmentCountsLoading = false,
  enrollmentCountsReady = false,
  cohortCountsLoading = false,
  cohortCountsReady = false,
}: AnalyticsSidebarProps) => {
  const notAssignedKey = SIDEBAR_FILTER_KEY.residency(NOT_ASSIGNED_FILTER_LABEL);

  return (
    <aside className="analytics-sidebar">
      <h3 className="sidebar-section-title">Enrollment Type</h3>
      <div className="filter-list">
        {renderFilters(
          studentFilters,
          selectedSidebarFilter,
          onSelectSidebarFilter,
          enrollmentCountsLoading,
          enrollmentCountsReady,
        )}
      </div>

      <h3 className="sidebar-section-title">Cohort</h3>
      <label className="filter-row cohort-not-assigned">
        <RowLoadingIndicator loading={enrollmentCountsLoading} />
        <input
          type="radio"
          name={SIDEBAR_RADIO_NAME}
          className="filter-radio"
          checked={selectedSidebarFilter === notAssignedKey}
          onChange={() => onSelectSidebarFilter(notAssignedKey)}
        />
        <span className="filter-label">{notAssignedFilter.label}</span>
        <FilterCount
          count={notAssignedFilter.count}
          loading={enrollmentCountsLoading}
          ready={enrollmentCountsReady}
          danger
        />
      </label>

      <div className="cohort-list">
        {cohortFilters.map((item, idx) => {
          const filterKey = SIDEBAR_FILTER_KEY.cohort(item.label);
          return (
            <label key={`${item.label}-${item.schedule}-${idx}`} className="cohort-row">
              <RowLoadingIndicator loading={cohortCountsLoading} />
              <input
                type="radio"
                name={SIDEBAR_RADIO_NAME}
                className="filter-radio"
                checked={selectedSidebarFilter === filterKey}
                onChange={() => onSelectSidebarFilter(filterKey)}
              />
              <div className="cohort-copy">
                <span className="cohort-label">{item.label}</span>
                <span className="cohort-schedule">{item.schedule}</span>
              </div>
              <span className="cohort-badge">
                {!cohortCountsReady && cohortCountsLoading ? null : (
                  <>
                    {item.total} <em>({item.ready})</em>
                  </>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </aside>
  );
};

export default AnalyticsSidebar;
