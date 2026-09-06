import SpinnerIcon from './SpinnerIcon';

import { SIDEBAR_FILTER_KEY } from '../data/api';
import type {
  CohortRecord,
  FilterRecord,
  IsSeasonOption,
  IsYearOption,
} from '../data/analyticsData';
import {
  IS_SEASON_OPTIONS,
  IS_YEAR_OPTIONS,
  isSeasonActiveForCohort,
  isYearActiveForSeason,
  NOT_ASSIGNED_FILTER_LABEL,
} from '../data/analyticsData';

const ENROLLMENT_RADIO = 'analytics-sidebar-enrollment';
const YEAR_RADIO = 'analytics-sidebar-year';
const SEASON_RADIO = 'analytics-sidebar-season';
const COHORT_RADIO = 'analytics-sidebar-cohort';

const RowLoadingIndicator = ({ loading = false }: { loading?: boolean }) => (
  loading ? (
    <span className="filter-row-loading" aria-label="Loading count">
      <SpinnerIcon size={12} />
    </span>
  ) : null
);

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
  if (loading && !ready) {
    return <span className={`filter-count ${danger ? 'danger' : ''}`} />;
  }

  return (
    <span className={`filter-count ${danger ? 'danger' : ''}`}>
      {count}
    </span>
  );
};

const yearLabel = (year: IsYearOption) => (
  year === 'not-assigned' ? NOT_ASSIGNED_FILTER_LABEL : year
);

const seasonLabel = (season: IsSeasonOption) => {
  if (season === 'not-assigned') {
    return NOT_ASSIGNED_FILTER_LABEL;
  }
  return season.charAt(0).toUpperCase() + season.slice(1);
};

type AnalyticsSidebarProps = {
  studentFilters: FilterRecord[];
  notAssignedFilter: FilterRecord;
  cohortFilters: CohortRecord[];
  enrollmentKey: string | null;
  selectedYear: IsYearOption | null;
  selectedSeason: IsSeasonOption | null;
  selectedCohort: number | 'not-assigned' | null;
  yearCounts: Record<IsYearOption, number>;
  seasonCounts: Record<IsSeasonOption, number>;
  onSelectEnrollment: (filterKey: string) => void;
  onSelectYear: (year: IsYearOption) => void;
  onSelectSeason: (season: IsSeasonOption) => void;
  onSelectCohort: (cohort: number | 'not-assigned') => void;
  onClearSeason: () => void;
  onClearCohort: () => void;
  /** Global enrollment list ready (unfiltered `/counts/filters/`). */
  enrollmentCountsReady?: boolean;
  /** First load: show loaders on every enrollment row. */
  enrollmentListLoading?: boolean;
  /** IS Year: global list on first load; selected year refreshes from scoped `?year=`. */
  yearCountsLoading?: boolean;
  yearCountsReady?: boolean;
  yearSeasonCountsReady?: boolean;
  /** First load / season refetch: show loaders on every season row. */
  seasonListLoading?: boolean;
  cohortCountsReady?: boolean;
  /** When true, every cohort row shows a loader (first season load). */
  cohortListLoading?: boolean;
  /**
   * Per-row scoped loaders — only the active filter option shows a spinner
   * (enrollment / year / season / cohort).
   */
  loadingEnrollmentKey?: string | null;
  loadingYear?: IsYearOption | null;
  loadingSeason?: IsSeasonOption | null;
  loadingCohort?: number | 'not-assigned' | null;
  /* Below the mobile breakpoint the sidebar slides in over the table instead of
     sitting beside it; on desktop it is always visible and these are inert. */
  open?: boolean;
  onClose?: () => void;
};

const AnalyticsSidebar = ({
  studentFilters,
  notAssignedFilter,
  cohortFilters,
  enrollmentKey,
  selectedYear,
  selectedSeason,
  selectedCohort,
  yearCounts,
  seasonCounts,
  onSelectEnrollment,
  onSelectYear,
  onSelectSeason,
  onSelectCohort,
  onClearSeason,
  onClearCohort,
  enrollmentCountsReady = false,
  enrollmentListLoading = false,
  yearCountsLoading = false,
  yearCountsReady = false,
  yearSeasonCountsReady = false,
  seasonListLoading = false,
  cohortCountsReady = false,
  cohortListLoading = false,
  loadingEnrollmentKey = null,
  loadingYear = null,
  loadingSeason = null,
  loadingCohort = null,
  open = false,
  onClose,
}: AnalyticsSidebarProps) => {
  const seasonEnabled = isYearActiveForSeason(selectedYear);
  const cohortEnabled = isSeasonActiveForCohort(selectedSeason);
  const seasonHasSelection = selectedSeason != null;
  const cohortHasSelection = selectedCohort != null;

  return (
    <aside className={`analytics-sidebar${open ? ' analytics-sidebar--open' : ''}`}>
      {/* Mobile-only affordance: the panel covers the table when open, so it
          needs its own way out. CSS hides it at desktop widths. */}
      <div className="analytics-sidebar-mobile-head">
        <h2 className="analytics-sidebar-mobile-title">Filters</h2>
        <button
          type="button"
          className="analytics-sidebar-mobile-close"
          onClick={onClose}
          aria-label="Close filters"
        >
          &times;
        </button>
      </div>
      <h3 className="sidebar-section-title">Enrollment Type</h3>
      <div className="filter-list">
        {studentFilters.map((item) => {
          const filterKey = SIDEBAR_FILTER_KEY.student(item.label);
          const rowLoading = enrollmentListLoading || loadingEnrollmentKey === filterKey;
          return (
            <label key={`student-${item.label}`} className="filter-row">
              <RowLoadingIndicator loading={rowLoading} />
              <input
                type="radio"
                name={ENROLLMENT_RADIO}
                className="filter-radio filter-radio--accent"
                checked={enrollmentKey === filterKey}
                onChange={() => onSelectEnrollment(filterKey)}
              />
              <span className="filter-label">{item.label}</span>
              <FilterCount
                count={item.count}
                loading={rowLoading}
                ready={rowLoading ? false : enrollmentCountsReady}
              />
            </label>
          );
        })}
      </div>

      <h3 className="sidebar-section-title">IS Year</h3>
      <div className="filter-list">
        {IS_YEAR_OPTIONS.map((year) => {
          const rowLoading = yearCountsLoading || loadingYear === year;
          return (
            <label key={year} className="filter-row">
              <RowLoadingIndicator loading={rowLoading} />
              <input
                type="radio"
                name={YEAR_RADIO}
                className="filter-radio filter-radio--accent"
                checked={selectedYear === year}
                onChange={() => onSelectYear(year)}
              />
              <span className="filter-label">{yearLabel(year)}</span>
              <FilterCount
                count={yearCounts[year]}
                loading={rowLoading}
                ready={rowLoading ? false : yearCountsReady}
                danger={year === 'not-assigned'}
              />
            </label>
          );
        })}
      </div>

      <div className="sidebar-section-heading">
        <h3 className="sidebar-section-title">IS Season</h3>
        {seasonHasSelection && (
          <button type="button" className="sidebar-clear-btn" onClick={onClearSeason}>
            Clear
          </button>
        )}
      </div>
      <div className={`filter-list ${seasonEnabled ? '' : 'filter-list--disabled'}`}>
        {IS_SEASON_OPTIONS.map((season) => {
          const rowLoading = seasonEnabled && (seasonListLoading || loadingSeason === season);
          return (
            <label
              key={season}
              className={`filter-row ${seasonEnabled ? '' : 'filter-row--disabled'}`}
            >
              <RowLoadingIndicator loading={rowLoading} />
              <input
                type="radio"
                name={SEASON_RADIO}
                className="filter-radio filter-radio--accent"
                checked={selectedSeason === season}
                disabled={!seasonEnabled}
                onChange={() => onSelectSeason(season)}
              />
              <span className="filter-label">{seasonLabel(season)}</span>
              {seasonEnabled ? (
                <FilterCount
                  count={seasonCounts[season]}
                  loading={rowLoading}
                  ready={rowLoading ? false : yearSeasonCountsReady}
                  danger={season === 'not-assigned'}
                />
              ) : null}
            </label>
          );
        })}
      </div>

      <div className="sidebar-section-heading">
        <h3 className="sidebar-section-title">IS Cohort</h3>
        {cohortHasSelection && (
          <button type="button" className="sidebar-clear-btn" onClick={onClearCohort}>
            Clear
          </button>
        )}
      </div>

      {!cohortEnabled ? (
        <p className="cohort-empty-msg">
          Year and Season have to be selected to view the cohort list.
        </p>
      ) : (
        <div className="cohort-list">
          <label className="filter-row cohort-not-assigned">
            <RowLoadingIndicator loading={loadingCohort === 'not-assigned' || cohortListLoading} />
            <input
              type="radio"
              name={COHORT_RADIO}
              className="filter-radio filter-radio--accent"
              checked={selectedCohort === 'not-assigned'}
              onChange={() => onSelectCohort('not-assigned')}
            />
            <span className="filter-label">{notAssignedFilter.label}</span>
            <span className="cohort-split-count">
              {loadingCohort === 'not-assigned' || cohortListLoading ? null : (
                <>
                  <em className="cohort-split-count__total cohort-split-count__total--danger">
                    {notAssignedFilter.count}
                  </em>
                  <span className="cohort-split-count__sep" aria-hidden="true">|</span>
                  <em className="cohort-split-count__ready">0</em>
                </>
              )}
            </span>
          </label>

          {cohortFilters.length === 0 ? (
            <p className="cohort-empty-msg">No cohorts for this year and season.</p>
          ) : cohortFilters.map((item) => {
            /** Cohort click: loader + count refresh only on that row. Season change: all rows. */
            const rowLoading = loadingCohort === item.id || cohortListLoading;
            return (
              <label key={`cohort-${item.id}`} className="cohort-row">
                <RowLoadingIndicator loading={rowLoading} />
                <input
                  type="radio"
                  name={COHORT_RADIO}
                  className="filter-radio filter-radio--accent"
                  checked={selectedCohort === item.id}
                  onChange={() => onSelectCohort(item.id)}
                />
                <div className="cohort-copy">
                  <span className="cohort-label">{item.label}</span>
                </div>
                <span className="cohort-split-count">
                  {rowLoading ? null : (
                    <>
                      <em className="cohort-split-count__total">{item.total}</em>
                      <span className="cohort-split-count__sep" aria-hidden="true">|</span>
                      <em className="cohort-split-count__ready">{item.ready}</em>
                    </>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </aside>
  );
};

export default AnalyticsSidebar;
