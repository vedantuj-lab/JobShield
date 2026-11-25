import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  ClipboardList,
  Database,
  FileSearch,
  GlobeLock,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo, DemoModeBanner } from '../common/RiskDisplay';

const ADMIN_LINKS = [
  { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/scans', label: 'Scan Monitoring', icon: FileSearch },
  { to: '/admin/moderation', label: 'Community Moderation', icon: ShieldCheck },
  { to: '/admin/companies', label: 'Company Records', icon: Building2 },
  { to: '/admin/domains', label: 'Domain & Threat Indicators', icon: GlobeLock },
  { to: '/admin/evidence', label: 'Evidence Records', icon: Database },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { to: '/admin/health', label: 'System Health', icon: Activity },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#174D3B] text-[#E9D9C4]">
      <div className="flex h-16 items-center justify-between px-5 border-b border-[#C69B36]/25 bg-[#123D2F]">
        <Link to="/admin/overview" onClick={() => setSidebarOpen(false)}>
          <BrandLogo variant="forest" />
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-md p-1.5 text-[#E9D9C4] hover:bg-[#16765B]"
          aria-label="Close admin sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 py-3 border-b border-[#C69B36]/20 bg-[#123D2F]/80 text-xs font-semibold text-[#E3B34C]">
        Security Operations Console
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {ADMIN_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#16765B] text-[#F7F0E5] border border-[#C69B36]/45 shadow-xs'
                    : 'text-[#E9D9C4]/90 hover:bg-[#16765B]/55 hover:text-[#F7F0E5]'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[#C69B36]/25 p-3 bg-[#123D2F]/60">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#E9D9C4] hover:bg-[#16765B] hover:text-[#F7F0E5] transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#EFE4D4] text-[#29272B]">
      <aside className="hidden lg:block w-68 shrink-0 border-r border-[#174D3B]/30">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 max-w-[85vw] h-full shadow-xl">{sidebarContent}</div>
          <div
            className="flex-1 bg-[#29272B]/70"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#C69B36]/30 bg-[#29272B] text-[#F7F0E5] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin navigation"
              className="lg:hidden rounded-lg p-2 text-[#E9D9C4] hover:bg-[#174D3B]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-[#F7F0E5] truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs text-[#E9D9C4]">
            <span className="hidden sm:inline font-semibold text-[#A7BEA8]">
              Administrator Console
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-[#C69B36]">·</span>
            <span className="font-medium text-[#F0DFBD] max-w-[200px] truncate">
              {user?.email}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <DemoModeBanner theme="admin" />
          {children}
        </main>
      </div>
    </div>
  );
}
