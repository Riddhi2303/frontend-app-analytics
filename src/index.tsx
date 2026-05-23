import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, mergeConfig,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import { Navigate, Route, Routes } from 'react-router-dom';

import messages from './i18n';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import { store } from './store';

import './index.scss';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider store={store}>
      <Routes>
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/" element={<Navigate to="/analytics" replace />} />
        <Route path="*" element={<Navigate to="/analytics" replace />} />
      </Routes>
    </AppProvider>,
    rootEl,
  );
});

subscribe(APP_INIT_ERROR, (message: string) => {
  ReactDOM.render(<ErrorPage message={message} />, rootEl);
});

initialize({
  messages,
  handlers: {
    config: () => {
      mergeConfig({
        STUDENT_ANALYTICS_API_BASE_URL: process.env.STUDENT_ANALYTICS_API_BASE_URL || '',
        STUDENT_ANALYTICS_API_PATH: process.env.STUDENT_ANALYTICS_API_PATH || '',
      });
    },
    // Skip backend auth calls for frontend-only local development.
    auth: async () => {},
  },
});
