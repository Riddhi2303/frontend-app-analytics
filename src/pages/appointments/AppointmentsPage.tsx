import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '@openedx/paragon';

import AnalyticsTopNav from '../analytics/components/AnalyticsTopNav';
import { fetchMyRolesApi, type MyRolesResponse } from '../analytics/data/api';
import AppointmentsFiltersRow, { type AppointmentCategoryFilter } from './AppointmentsFiltersRow';
import AppointmentsSidebar from './AppointmentsSidebar';
import AppointmentsTable from './AppointmentsTable';
import { fetchEventCountsApi, fetchFilterOptionsApi, fetchMentoringEventsApi } from './appointmentsApi';
import {
  CATEGORY_STATUS_FILTER,
  COURSES,
  EMPTY_CATEGORY_COUNTS,
  formatUsername,
  mapEventCounts,
  mapMentoringEventToAppointment,
  uniqueMonths,
  type AppointmentCourseOption,
  type AppointmentRecord,
} from './appointmentsData';

import '../analytics/analytics.scss';
import './appointments.scss';

const PAGE_SIZE = 20;
const FALLBACK_COURSES: AppointmentCourseOption[] = COURSES.map((course) => ({
  code: course.code,
  name: course.name,
}));

const cycleOption = (options: string[], current: string, delta: number) => {
  const index = Math.max(0, options.indexOf(current));
  const next = (index + delta + options.length) % options.length;
  return options[next];
};

const AppointmentsPage = () => {
  const [roles, setRoles] = useState<MyRolesResponse | null>(null);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [counts, setCounts] = useState(EMPTY_CATEGORY_COUNTS);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAiInvoice, setTotalAiInvoice] = useState(0);
  const [totalMafInvoice, setTotalMafInvoice] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<string[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [courses, setCourses] = useState<AppointmentCourseOption[]>(FALLBACK_COURSES);
  const [selectedMentor, setSelectedMentor] = useState('All Mentors');
  const [selectedStudent, setSelectedStudent] = useState('All Students');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategoryFilter>('upcoming');
  const [page, setPage] = useState(1);

  const listFilters = useMemo(() => ({
    mentor: selectedMentor === 'All Mentors' ? undefined : selectedMentor,
    student: selectedStudent === 'All Students' ? undefined : selectedStudent,
    course: selectedCourse === 'all' ? undefined : selectedCourse,
  }), [selectedCourse, selectedMentor, selectedStudent]);

  useEffect(() => {
    let cancelled = false;
    const loadRoles = async () => {
      try {
        const result = await fetchMyRolesApi();
        if (!cancelled) {
          setRoles(result);
        }
      } catch {
        // Student columns when roles cannot be determined.
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    };
    loadRoles();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadFilterOptions = async () => {
      try {
        const options = await fetchFilterOptionsApi('admin');
        if (cancelled) {
          return;
        }
        setMentors(options.mentors);
        setStudents(options.students);
        setCourses([
          ...FALLBACK_COURSES,
          ...options.courses.map((course) => ({
            code: course.value,
            name: course.label,
          })),
        ]);
      } catch {
        // Keep All Mentors / All Students / All Courses if the options call fails.
      }
    };
    loadFilterOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCounts = async () => {
      try {
        const payload = await fetchEventCountsApi(listFilters);
        if (!cancelled) {
          setCounts(mapEventCounts(payload));
        }
      } catch {
        if (!cancelled) {
          setCounts(EMPTY_CATEGORY_COUNTS);
        }
      }
    };
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [listFilters]);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const payload = await fetchMentoringEventsApi({
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          statusFilter: CATEGORY_STATUS_FILTER[selectedCategory],
          ...listFilters,
        });
        if (cancelled) {
          return;
        }
        setAppointments(payload.results.map((event) => {
          const row = mapMentoringEventToAppointment(event);
          return {
            ...row,
            studentName: formatUsername(row.studentName),
            mentorName: formatUsername(row.mentorName),
          };
        }));
        setTotalCount(payload.count);
        setTotalAiInvoice(payload.ai_total_calculated_amount ?? 0);
        setTotalMafInvoice(payload.maf_total_calculated_amount ?? 0);
      } catch {
        if (!cancelled) {
          setAppointments([]);
          setTotalCount(0);
          setEventsError('Could not load appointments.');
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    };
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [listFilters, page, selectedCategory]);

  const months = useMemo(() => uniqueMonths(appointments), [appointments]);

  const filtered = useMemo(() => appointments.filter((row) => {
    if (selectedMonth !== 'All Months' && !row.date.endsWith(selectedMonth) && !row.date.includes(selectedMonth)) {
      return false;
    }
    return true;
  }), [appointments, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const isStudentOnly = Boolean(
    roles && !roles.is_superuser && !roles.is_staff && !roles.is_mentor,
  );
  const showInvoices = !isStudentOnly;

  const handleCancel = (id: string) => {
    setAppointments((prev) => prev.map((row) => (
      row.id === id ? { ...row, status: 'Cancelled', canJoin: false } : row
    )));
  };

  useEffect(() => {
    setPage(1);
  }, [selectedMentor, selectedStudent, selectedMonth, selectedCourse, selectedCategory]);

  if (rolesLoading) {
    return (
      <main className="analytics-page appointments-page">
        <AnalyticsTopNav />
        <div className="analytics-roles-loading" aria-busy="true" aria-live="polite">
          <Spinner animation="border" screenReaderText="Loading" />
        </div>
      </main>
    );
  }

  return (
    <main className="analytics-page appointments-page">
      <AnalyticsTopNav />
      <section className="analytics-content">
        <AppointmentsSidebar
          mentors={mentors}
          students={students}
          months={months}
          courses={courses}
          selectedMentor={selectedMentor}
          selectedStudent={selectedStudent}
          selectedMonth={selectedMonth}
          selectedCourse={selectedCourse}
          totalAiInvoice={showInvoices ? totalAiInvoice : null}
          totalMafInvoice={showInvoices ? totalMafInvoice : null}
          onMentorChange={setSelectedMentor}
          onStudentChange={setSelectedStudent}
          onMonthChange={setSelectedMonth}
          onCourseChange={setSelectedCourse}
          onMentorStep={(delta) => setSelectedMentor(
            cycleOption(['All Mentors', ...mentors], selectedMentor, delta),
          )}
          onMonthStep={(delta) => setSelectedMonth(
            cycleOption(['All Months', ...months], selectedMonth, delta),
          )}
        />
        <section className="analytics-main">
          <AppointmentsFiltersRow
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            counts={counts}
            pagination={{ currentPage, totalPages }}
            onPageChange={setPage}
          />
          <div className="analytics-table-area">
            {eventsLoading ? (
              <div className="analytics-roles-loading" aria-busy="true" aria-live="polite">
                <Spinner animation="border" screenReaderText="Loading appointments" />
              </div>
            ) : eventsError ? (
              <div className="analytics-table-error" role="alert">{eventsError}</div>
            ) : (
              <AppointmentsTable appointments={filtered} onCancel={handleCancel} />
            )}
          </div>
        </section>
      </section>
    </main>
  );
};

export default AppointmentsPage;
