//  src/pages/admin/pages/AdminDashboard.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { AdminProvider } from "../AdminContext";
import AdminLayout from "../AdminLayout";

import AdminOverviewPage from "./AdminOverviewPage";
import AdminAuctionsPage from "./AdminAuctionsPage";
import AdminReportsPage from "./AdminReportsPage";
import AdminCalendarPage from "./AdminCalendarPage";
import AdminNoticesPage from "./AdminNoticesPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminChatPage from "./AdminChatPage";

const AdminDashboard: React.FC = () => {
  return (
    <AdminProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="auctions" element={<AdminAuctionsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
          <Route path="notices" element={<AdminNoticesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="chats" element={<AdminChatPage />} />
        </Route>
      </Routes>
    </AdminProvider>
  );
};

export default AdminDashboard;
