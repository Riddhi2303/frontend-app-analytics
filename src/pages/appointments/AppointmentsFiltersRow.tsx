import { ChevronRightIcon } from './AppointmentsIcons';
import type { AppointmentCategory } from './appointmentsData';

export type AppointmentCategoryFilter = 'all' | AppointmentCategory;

type AppointmentsFiltersRowProps = {
  selectedCategory: AppointmentCategoryFilter;
  onCategoryChange: (value: AppointmentCategoryFilter) => void;
  counts: Record<AppointmentCategoryFilter, number>;
  pagination: {
    currentPage: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
};

const CHIP_DEFS: Array<{
  id: AppointmentCategoryFilter;
  label: string;
  countClass: string;
}> = [
  { id: 'upcoming', label: 'Upcoming', countClass: 'appt-chip-count--blue' },
  { id: 'review-pending', label: 'Review pending', countClass: 'appt-chip-count--gold' },
  { id: 'completed-ai', label: 'Completed AI', countClass: 'appt-chip-count--green' },
  { id: 'completed-maf', label: 'Completed MAF', countClass: 'appt-chip-count--green' },
  { id: 'student-absent', label: 'Student Absent', countClass: 'appt-chip-count--red' },
  { id: 'mentor-absent', label: 'Mentor Absent', countClass: 'appt-chip-count--red' },
  { id: 'cancelled-rescheduled', label: 'Cancelled / Rescheduled', countClass: 'appt-chip-count--muted' },
  { id: 'all', label: 'All', countClass: 'appt-chip-count--muted' },
];

const AppointmentsFiltersRow = ({
  selectedCategory,
  onCategoryChange,
  counts,
  pagination,
  onPageChange,
}: AppointmentsFiltersRowProps) => (
  <section className="analytics-filters-row appointments-filters-row">
    <span className="appt-showing-label">Showing:</span>
    <div className="appt-chip-list">
      {CHIP_DEFS.map((chip) => {
        const isActive = selectedCategory === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            className={`appt-chip ${isActive ? 'appt-chip--active' : ''}`}
            onClick={() => onCategoryChange(chip.id)}
          >
            <span className="appt-chip-label">{chip.label}</span>
            <span className={`appt-chip-count ${chip.countClass}`}>{counts[chip.id] ?? 0}</span>
          </button>
        );
      })}
    </div>

    <div className="pagination-block">
      <span className="pagination-range">
        {pagination.currentPage} of {pagination.totalPages}
      </span>
      <button
        type="button"
        className="pager-nav pager-nav--icon"
        onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
        disabled={pagination.currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronRightIcon className="appt-pager-icon appt-pager-icon--prev" />
      </button>
      <button
        type="button"
        className="pager-nav pager-nav--icon"
        onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
        disabled={pagination.currentPage >= pagination.totalPages}
        aria-label="Next page"
      >
        <ChevronRightIcon className="appt-pager-icon" />
      </button>
    </div>
  </section>
);

export default AppointmentsFiltersRow;
