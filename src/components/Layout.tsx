import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        تخطي إلى المحتوى الرئيسي
      </a>

      <Sidebar />

      <div className="app-shell__main">
        <Header />

        <main id="main-content" className="app-shell__content" role="main" aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
