import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StudentNavbar } from './StudentNavbar';
import { StudentBottomTabs } from './StudentBottomTabs';

export const StudentLayout: React.FC = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/app/chat');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: isChat ? '100vh' : undefined,
        width: '100%',
        position: 'relative',
        overflow: isChat ? 'hidden' : undefined
      }}
    >
      <StudentNavbar />

      <main
        className={isChat ? 'chat-main-container' : undefined}
        style={{
          flex: 1,
          padding: isChat ? 0 : '1.5rem',
          maxWidth: isChat ? '100%' : '1280px',
          width: '100%',
          margin: isChat ? 0 : '0 auto',
          paddingBottom: isChat ? 0 : '80px', // spacing for bottom tabs on mobile
          display: isChat ? 'flex' : 'block',
          flexDirection: isChat ? 'column' : undefined,
          height: isChat ? 'calc(100vh - 66px)' : undefined,
          minHeight: 0,
          overflow: isChat ? 'hidden' : undefined
        }}
      >
        <Outlet />
      </main>

      {!isChat && <StudentBottomTabs />}
    </div>
  );
};
