import React from 'react';
import { Outlet } from 'react-router-dom';
import { StudentNavbar } from './StudentNavbar';
import { StudentBottomTabs } from './StudentBottomTabs';

export const StudentLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', position: 'relative' }}>
      <StudentNavbar />

      <main
        style={{
          flex: 1,
          padding: '1.5rem',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          paddingBottom: '80px' // spacing for bottom tabs on mobile
        }}
      >
        <Outlet />
      </main>

      <StudentBottomTabs />
    </div>
  );
};
