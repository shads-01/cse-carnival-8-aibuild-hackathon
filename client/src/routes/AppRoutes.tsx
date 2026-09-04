import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { StudentLayout } from '../components/layout/StudentLayout';
import { RoleGuard, SmartRedirect } from '../components/layout/RoleGuard';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { ForgotPage } from '../pages/auth/ForgotPage';

// Admin Pages
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { AdminSchedulesPage } from '../pages/admin/AdminSchedulesPage';
import { AdminRoomsPage } from '../pages/admin/AdminRoomsPage';
import { AdminEventsPage } from '../pages/admin/AdminEventsPage';
import { AdminAnnouncementsPage } from '../pages/admin/AdminAnnouncementsPage';
import { AdminAssignmentsPage } from '../pages/admin/AdminAssignmentsPage';
import { AdminRequestsPage } from '../pages/admin/AdminRequestsPage';
import { AdminChatPage } from '../pages/admin/AdminChatPage';

// Student Pages
import { StudentHomePage } from '../pages/student/StudentHomePage';
import { StudentSchedulePage } from '../pages/student/StudentSchedulePage';
import { StudentEventsPage } from '../pages/student/StudentEventsPage';
import { StudentAnnouncementsPage } from '../pages/student/StudentAnnouncementsPage';
import { StudentAssignmentsPage } from '../pages/student/StudentAssignmentsPage';
import { StudentActivityPage } from '../pages/student/StudentActivityPage';
import { StudentChatPage } from '../pages/student/StudentChatPage';

export const AppRoutes: React.FC = () => {
  const { fetchProfile } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <Routes>
      {/* Root & Catch-all Smart Redirects */}
      <Route path="/" element={<SmartRedirect />} />

      {/* Public Auth Shell (3 routes) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
      </Route>

      {/* Admin Operations Shell (8 routes) */}
      <Route
        path="/admin"
        element={
          <RoleGuard requiredRole="ADMIN">
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="schedules" element={<AdminSchedulesPage />} />
        <Route path="rooms" element={<AdminRoomsPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="assignments" element={<AdminAssignmentsPage />} />
        <Route path="requests" element={<AdminRequestsPage />} />
        <Route path="chat" element={<AdminChatPage />} />
      </Route>

      {/* Student Operations Shell (7 routes) */}
      <Route
        path="/app"
        element={
          <RoleGuard requiredRole="USER">
            <StudentLayout />
          </RoleGuard>
        }
      >
        <Route index element={<StudentHomePage />} />
        <Route path="schedule" element={<StudentSchedulePage />} />
        <Route path="events" element={<StudentEventsPage />} />
        <Route path="announcements" element={<StudentAnnouncementsPage />} />
        <Route path="assignments" element={<StudentAssignmentsPage />} />
        <Route path="activity" element={<StudentActivityPage />} />
        <Route path="chat" element={<StudentChatPage />} />
      </Route>

      {/* Catch-all 404 Guard */}
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
};
