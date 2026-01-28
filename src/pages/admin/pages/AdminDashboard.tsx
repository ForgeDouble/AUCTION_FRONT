//  src/pages/admin/pages/AdminDashboard.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider } from "../AdminContext";
import { useAdminStore } from "../AdminContext";
import AdminLayout from "../AdminLayout";

import AdminOverviewPage from "./AdminOverviewPage";
import AdminAuctionsPage from "./AdminAuctionsPage";
import AdminReportsPage from "./AdminReportsPage";
import AdminCalendarPage from "./AdminCalendarPage";
import AdminNoticesPage from "./AdminNoticesPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminChatPage from "./AdminChatPage";

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminRole } = useAdminStore();
  const roleUpper = String(adminRole ?? "").toUpperCase();
  const isAdminOnly = roleUpper.includes("ADMIN");

  if (!isAdminOnly) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const AdminDashboard: React.FC = () => {
  return (
    <AdminProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="auctions" element={<AdminAuctionsPage />} />
          
          <Route path="reports" element={<RequireAdmin><AdminReportsPage /></RequireAdmin>} />
          <Route path="calendar" element={<AdminCalendarPage />} />
          <Route path="notices" element={<AdminNoticesPage />} />

          <Route path="users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
          <Route path="chats" element={<AdminChatPage />} />
        </Route>
      </Routes>
    </AdminProvider>
  );
};

export default AdminDashboard;
