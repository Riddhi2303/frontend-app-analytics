import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '@openedx/paragon';

import AnalyticsTopNav from '../analytics/components/AnalyticsTopNav';
import { fetchMyRolesApi, type MyRolesResponse } from '../analytics/data/api';
import AppointmentsFiltersRow, { type AppointmentCategoryFilter } from './AppointmentsFiltersRow';
import AppointmentsSidebar from './AppointmentsSidebar';
import AppointmentsTable from './AppointmentsTable';
import {
  SAMPLE_APPOINTMENTS,
  getAppointmentCategory,
  sumInvoiceAmount,
  uniqueMentors,
  uniqueMonths,
  uniqueStudents,
} from './appointmentsData';

import '../analytics/analytics.scss';
import './appointments.scss';

const PAGE_SIZE = 10;

const cycleOption = (options: string[], current: string, delta: number) => {
  const index = Math.max(0, options.indexOf(current));
  const next = (index + delta + options.length) % options.length;
  return options[next];
};

const AppointmentsPage = () => {
  const [roles, setRoles] = useState<MyRolesResponse | null>(null);
  const [loading, setRolesLoading] = useState(true);
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
  const [selectedMentor, setSelectedMentor] = useState('All Mentors');
  const [selectedStudent, setSelectedStudent] = useState('All Students');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategoryFilter>('upcoming');
  const [page, setPage] = useState(1);

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

  const mentors = useMemo(() => uniqueMentors(appointments), [appointments]);
  const students = useMemo(() => uniqueStudents(appointments), [appointments]);
  const months = useMemo(() => uniqueMonths(appointments), [appointments]);

  const filtered = useMemo(() => appointments.filter((row) => {
    if (selectedMonth !== 'All Months' && !row.date.endsWith(selectedMonth) && !row.date.includes(selectedMonth)) {
      return false;
    }
    if (selectedMentor !== 'All Mentors' && row.mentorName !== selectedMentor) {
      return false;
    }
    if (selectedStudent !== 'All Students' && row.studentName !== selectedStudent) {
      return false;
    }
    if (selectedCourse !== 'all' && row.courseCode !== selectedCourse) {
      return false;
    }
    return true;
  }), [appointments, selectedCourse, selectedMentor, selectedMonth, selectedStudent]);

  const counts = useMemo(() => {
    const base: Record<AppointmentCategoryFilter, number> = {
      all: filtered.length,
      upcoming: 0,
      'review-pending': 0,
      'completed-ai': 0,
      'completed-maf': 0,
      'student-absent': 0,
      'mentor-absent': 0,
      'cancelled-rescheduled': 0,
    };
    filtered.forEach((row) => {
      base[getAppointmentCategory(row)] += 1;
    });
    return base;
  }, [filtered]);

  const visible = useMemo(() => {
    if (selectedCategory === 'all') {
      return filtered;
    }
    return filtered.filter((row) => getAppointmentCategory(row) === selectedCategory);
  }, [filtered, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const isStudentOnly = Boolean(
    roles && !roles.is_superuser && !roles.is_staff && !roles.is_mentor,
  );
  const showInvoices = !isStudentOnly;
  const totalAiInvoice = useMemo(() => sumInvoiceAmount(filtered, 'AI'), [filtered]);
  const totalMafInvoice = useMemo(() => sumInvoiceAmount(filtered, 'MAF'), [filtered]);

  const handleCancel = (id: string) => {
    setAppointments((prev) => prev.map((row) => (
      row.id === id ? { ...row, status: 'Cancelled', canJoin: false } : row
    )));
  };

  useEffect(() => {
    setPage(1);
  }, [selectedMentor, selectedStudent, selectedMonth, selectedCourse, selectedCategory]);

  if (loading) {
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
      {/* <AnalyticsTopNav /> */}
      <section className="analytics-content">
        <AppointmentsSidebar
          mentors={mentors}
          students={students}
          months={months}
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
            <AppointmentsTable appointments={pageRows} onCancel={handleCancel} />
          </div>
        </section>
      </section>
    </main>
  );
};

export default AppointmentsPage;
