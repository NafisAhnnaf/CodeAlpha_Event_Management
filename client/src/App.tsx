import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { EventsListPage } from "./pages/EventsListPage.tsx";
import { EventDetailPage } from "./pages/EventDetailPage.tsx";
import { AuthPage } from "./pages/AuthPage.tsx";
import { CreateEventPage } from "./pages/CreateEventPage.tsx";
import { MyRegistrationsPage } from "./pages/MyRegistrationsPage.tsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";
import { ProtectedRoute } from "./components/common/ProtectedRoute.tsx";
import { useThemeStore } from "./store/useThemeStore.ts";

export function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="events" element={<EventsListPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="auth" element={<AuthPage />} />

          {/* Protected Routes */}
          <Route
            path="events/create"
            element={
              <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-registrations"
            element={
              <ProtectedRoute>
                <MyRegistrationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
