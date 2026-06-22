import { useEffect, useState } from 'react';

import { Spinner } from '@openedx/paragon';

import { fetchMyRolesApi, isMentorAdminView } from './data/api';
import MentorAnalyticsDashboard from './MentorAnalyticsDashboard';
import StudentAnalyticsView from './components/StudentAnalyticsView';

import './analytics.scss';

const AnalyticsPage = () => {
  const [rolesLoading, setRolesLoading] = useState(true);
  const [showMentorDashboard, setShowMentorDashboard] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const roles = await fetchMyRolesApi();
        if (!cancelled) {
          setShowMentorDashboard(isMentorAdminView(roles));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load user roles.';
          setRolesError(message);
          setShowMentorDashboard(false);
        }
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

  if (rolesLoading) {
    return (
      <main className="analytics-page">
        <div className="analytics-roles-loading" aria-busy="true" aria-live="polite">
          <Spinner animation="border" screenReaderText="Loading analytics" />
        </div>
      </main>
    );
  }

  if (rolesError) {
    return (
      <main className="analytics-page">
        <div className="analytics-roles-error" role="alert">
          {rolesError}
        </div>
      </main>
    );
  }

  if (showMentorDashboard) {
    return <MentorAnalyticsDashboard />;
  }

  return <StudentAnalyticsView />;
};

export default AnalyticsPage;
