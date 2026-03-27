import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { t } from "../lib/i18n";
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Users,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

function getNavItems(): NavItem[] {
  return [
    { label: t("nav.board"), path: "/app/board", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["owner_admin", "staff"] },
    { label: t("nav.my_requests"), path: "/app/my-requests", icon: <ClipboardList className="h-4 w-4" />, roles: ["resident"] },
    { label: t("nav.report_issue"), path: "/app/report", icon: <PlusCircle className="h-4 w-4" />, roles: ["owner_admin", "staff", "resident"] },
    { label: t("nav.properties"), path: "/app/properties", icon: <Building2 className="h-4 w-4" />, roles: ["owner_admin", "staff"] },
    { label: t("nav.people"), path: "/app/people", icon: <Users className="h-4 w-4" />, roles: ["owner_admin"] },
    { label: t("nav.vendors"), path: "/app/vendors", icon: <Wrench className="h-4 w-4" />, roles: ["owner_admin", "staff"] },
    { label: t("nav.reports"), path: "/app/reports", icon: <BarChart3 className="h-4 w-4" />, roles: ["owner_admin", "staff"] },
    { label: t("nav.settings"), path: "/app/settings", icon: <Settings className="h-4 w-4" />, roles: ["owner_admin"] },
  ];
}

export function AppLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = getNavItems().filter(
    (item) => profile && item.roles.includes(profile.role_key),
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-card border-r flex flex-col transition-transform lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <span className="text-lg font-semibold text-primary">{t("auth.brand")}</span>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="text-xs text-muted-foreground mb-1 truncate">{profile?.full_name || profile?.email}</div>
          <div className="text-xs text-muted-foreground/60 mb-2 capitalize">{profile?.role_key?.replace("_", " ")}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-1"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.sign_out")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-14 border-b flex items-center px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-lg font-semibold text-primary">SkMeld</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
