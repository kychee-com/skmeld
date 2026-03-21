import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { AppLayout } from "./components/app-layout";
import { LoginPage } from "./pages/login";
import { ClaimPage } from "./pages/claim";
import { BoardPage } from "./pages/board";
import { RequestDetailPage } from "./pages/request-detail";
import { MyRequestsPage } from "./pages/my-requests";
import { ReportPage } from "./pages/report";
import { PropertiesPage } from "./pages/properties";
import { PeoplePage } from "./pages/people";
import { VendorsPage } from "./pages/vendors";
import { ReportsPage } from "./pages/reports";
import { SettingsPage } from "./pages/settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { profile } = useAuth();
  if (!profile || !roles.includes(profile.role_key)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, profile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/claim" element={<ClaimPage />} />

      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={
          profile?.role_key === "resident"
            ? <Navigate to="/app/my-requests" replace />
            : <Navigate to="/app/board" replace />
        } />
        <Route path="board" element={<BoardPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="my-requests" element={<MyRequestsPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="people" element={<RoleRoute roles={["owner_admin"]}><PeoplePage /></RoleRoute>} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<RoleRoute roles={["owner_admin"]}><SettingsPage /></RoleRoute>} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/app" : "/login"} replace />} />
    </Routes>
  );
}
