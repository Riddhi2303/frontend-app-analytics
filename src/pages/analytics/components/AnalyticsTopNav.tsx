import MakersAsylumLogoIcon from './MakersAsylumLogoIcon';

const AnalyticsTopNav = () => (
  <header className="analytics-top-nav">
    <div className="top-nav-left">
      <MakersAsylumLogoIcon className="brand-icon" />
    </div>
    <nav className="top-nav-tabs">
      <button type="button" className="active">Students</button>
      <button type="button">Mentors</button>
      <button type="button">Appointments</button>
      <button type="button">Slots</button>
      <button type="button">Office Hours</button>
      <button type="button">Fellowship</button>
      <button type="button">Courses</button>
    </nav>
    <button type="button" className="admin-select">Admin</button>
  </header>
);

export default AnalyticsTopNav;
