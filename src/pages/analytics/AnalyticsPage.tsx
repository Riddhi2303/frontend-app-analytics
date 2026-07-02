import { useEffect, useState } from 'react';

import { Spinner } from '@openedx/paragon';

import MentorAnalyticsDashboard from './MentorAnalyticsDashboard';
import StudentAnalyticsView from './components/StudentAnalyticsView';
import { fetchMyRolesApi, isMentorAdminView, type MyRolesResponse } from './data/api';

import './analytics.scss';

const AnalyticsPage = () => {
  const [roles, setRoles] = useState<MyRolesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRoles = async () => {
      try {
        const result = await fetchMyRolesApi();
        if (!cancelled) {
          setRoles(result);
        }
      } catch {
        // Fall back to student view when roles cannot be determined.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRoles();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <main className="analytics-page">
        <div className="analytics-roles-loading" aria-busy="true" aria-live="polite">
          <Spinner animation="border" screenReaderText="Loading" />
        </div>
      </main>
    );
  }

  if (roles && isMentorAdminView(roles)) {
    return <MentorAnalyticsDashboard />;
  }

  return <StudentAnalyticsView />;
};

export default AnalyticsPage;
