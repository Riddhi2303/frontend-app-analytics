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
  if (!ready && loading) {
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
  enrollmentCountsLoading?: boolean;
  enrollmentCountsReady?: boolean;
  /** IS Year always uses global `/counts/filters` (not scoped). */
  yearCountsLoading?: boolean;
  yearCountsReady?: boolean;
  yearSeasonCountsLoading?: boolean;
  yearSeasonCountsReady?: boolean;
  cohortCountsLoading?: boolean;
  cohortCountsReady?: boolean;
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
  enrollmentCountsLoading = false,
  enrollmentCountsReady = false,
  yearCountsLoading = false,
  yearCountsReady = false,
  yearSeasonCountsLoading = false,
  yearSeasonCountsReady = false,
  cohortCountsLoading = false,
  cohortCountsReady = false,
}: AnalyticsSidebarProps) => {
  const seasonEnabled = isYearActiveForSeason(selectedYear);
  const cohortEnabled = isSeasonActiveForCohort(selectedSeason);
  const seasonHasSelection = selectedSeason != null;
  const cohortHasSelection = selectedCohort != null;

  return (
    <aside className="analytics-sidebar">
      <h3 className="sidebar-section-title">Enrollment Type</h3>
      <div className="filter-list">
        {studentFilters.map((item) => {
          const filterKey = SIDEBAR_FILTER_KEY.student(item.label);
          return (
            <label key={`student-${item.label}`} className="filter-row">
              <RowLoadingIndicator loading={enrollmentCountsLoading} />
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
                loading={enrollmentCountsLoading}
                ready={enrollmentCountsReady}
              />
            </label>
          );
        })}
      </div>

      <h3 className="sidebar-section-title">IS Year</h3>
      <div className="filter-list">
        {IS_YEAR_OPTIONS.map((year) => (
          <label key={year} className="filter-row">
            <RowLoadingIndicator loading={yearCountsLoading} />
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
              loading={yearCountsLoading}
              ready={yearCountsReady}
              danger={year === 'not-assigned'}
            />
          </label>
        ))}
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
        {IS_SEASON_OPTIONS.map((season) => (
          <label
            key={season}
            className={`filter-row ${seasonEnabled ? '' : 'filter-row--disabled'}`}
          >
            <RowLoadingIndicator loading={yearSeasonCountsLoading} />
            <input
              type="radio"
              name={SEASON_RADIO}
              className="filter-radio filter-radio--accent"
              checked={selectedSeason === season}
              disabled={!seasonEnabled}
              onChange={() => onSelectSeason(season)}
            />
            <span className="filter-label">{seasonLabel(season)}</span>
            <FilterCount
              count={seasonCounts[season]}
              loading={yearSeasonCountsLoading}
              ready={yearSeasonCountsReady}
              danger={season === 'not-assigned'}
            />
          </label>
        ))}
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
            <RowLoadingIndicator loading={enrollmentCountsLoading} />
            <input
              type="radio"
              name={COHORT_RADIO}
              className="filter-radio filter-radio--accent"
              checked={selectedCohort === 'not-assigned'}
              onChange={() => onSelectCohort('not-assigned')}
            />
            <span className="filter-label">{notAssignedFilter.label}</span>
            <span className="cohort-split-count">
              <em className="cohort-split-count__total cohort-split-count__total--danger">
                {notAssignedFilter.count}
              </em>
              <span className="cohort-split-count__sep" aria-hidden="true">|</span>
              <em className="cohort-split-count__ready">0</em>
            </span>
          </label>

          {cohortFilters.length === 0 ? (
            <p className="cohort-empty-msg">No cohorts for this year and season.</p>
          ) : cohortFilters.map((item) => (
            <label key={`cohort-${item.id}`} className="cohort-row">
              <RowLoadingIndicator loading={cohortCountsLoading} />
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
                {!cohortCountsReady && cohortCountsLoading ? null : (
                  <>
                    <em className="cohort-split-count__total">{item.total}</em>
                    <span className="cohort-split-count__sep" aria-hidden="true">|</span>
                    <em className="cohort-split-count__ready">{item.ready}</em>
                  </>
                )}
              </span>
            </label>
          ))}
        </div>
      )}
    </aside>
  );
};

export default AnalyticsSidebar;
