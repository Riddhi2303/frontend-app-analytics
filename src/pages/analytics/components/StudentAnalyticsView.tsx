import { useEffect, useState } from 'react';

import { Spinner } from '@openedx/paragon';

import { fetchStudentsAnalyticsApi } from '../data/api';
import type { ApiStudent } from '../data/analyticsData';
import AnalyticsTopNav from './AnalyticsTopNav';
import StudentDetailView from './StudentDetailView';

const StudentAnalyticsView = () => {
  const [student, setStudent] = useState<ApiStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { results } = await fetchStudentsAnalyticsApi();
        if (!cancelled) {
          setStudent(results[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load your analytics.';
          setError(message);
          setStudent(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="analytics-page analytics-page--student">
        <AnalyticsTopNav />
        <div className="student-analytics-loading" aria-busy="true" aria-live="polite">
          <Spinner animation="border" screenReaderText="Loading your analytics" />
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="analytics-page analytics-page--student">
        <AnalyticsTopNav />
        <div className="student-analytics-error" role="alert">
          {error ?? 'Student profile not found.'}
        </div>
      </main>
    );
  }

  return (
    <main className="analytics-page analytics-page--student">
      <AnalyticsTopNav />
      <StudentDetailView student={student} variant="page" />
    </main>
  );
};

export default StudentAnalyticsView;
