import { NavLink } from 'react-router-dom';

import MakersAsylumLogoIcon from './MakersAsylumLogoIcon';

const TABS = [
  { to: '/analytics', label: 'Students' },
  { label: 'Mentors' },
  { to: '/appointments', label: 'Appointments' },
  { label: 'Slots' },
  { label: 'Office Hours' },
  { label: 'Fellowship' },
  { label: 'Courses' },
] as const;

const AnalyticsTopNav = () => (
  <header className="analytics-top-nav">
    <div className="top-nav-left">
      <MakersAsylumLogoIcon className="brand-icon" />
    </div>
    <nav className="top-nav-tabs">
      {TABS.map((tab) => ('to' in tab ? (
        <NavLink
          key={tab.label}
          to={tab.to}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          {tab.label}
        </NavLink>
      ) : (
        <span key={tab.label} className="top-nav-tab-disabled">{tab.label}</span>
      )))}
    </nav>
    <button type="button" className="admin-select">Admin</button>
  </header>
);

export default AnalyticsTopNav;
