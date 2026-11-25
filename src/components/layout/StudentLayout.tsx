import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  ScanSearch,
  Settings,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/api';
import type { NotificationRecord } from '../../types/jobshield';
import { BrandLogo, DemoModeBanner } from '../common/RiskDisplay';

const STUDENT_LINKS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/scanner', label: 'Recruitment Scanner', icon: ScanSearch },
  { to: '/student/trust-intelligence', label: 'Trust Intelligence', icon: Network },
  { to: '/student/community', label: 'Community Threats', icon: ShieldAlert },
  { to: '/student/protection', label: 'Protection Centre', icon: ShieldCheck },
  { to: '/student/history', label: 'Scan History', icon: History },
  { to: '/student/saved', label: 'Saved Reports', icon: Bookmark },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
  { to: '/student/profile', label: 'Profile & Settings', icon: Settings },
];

export function StudentLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, demoResetVersion, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest<{ notifications: NotificationRecord[] }>('/api/users/notifications')
      .then((res) => {
        if (active) {
          setUnreadCount(res.notifications.filter((n) => !n.read).length);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [title, demoResetVersion]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#563653] text-[#F7F0E5]">
      <div className="flex h-16 items-center justify-between px-5 border-b border-[#B9A5C9]/20 bg-[#46304F]">
        <Link to="/student/dashboard" onClick={() => setSidebarOpen(false)}>
          <BrandLogo variant="plum" />
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-md p-1.5 text-[#E9E2F2] hover:bg-[#563653]"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 py-3 border-b border-[#B9A5C9]/20 bg-[#46304F]/85 text-xs font-semibold text-[#B9A5C9]">
        Citizen / Student Workspace
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {STUDENT_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#B9A5C9] text-[#29272B] font-semibold shadow-xs'
                    : 'text-[#F0DFBD]/90 hover:bg-[#46304F] hover:text-[#F7F0E5]'
                }`
              }
            >
              <span className="flex items-center gap-3 truncate">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.to === '/student/notifications' && unreadCount > 0 && (
                <span className="font-mono-tabular text-xs font-bold text-[#E27D70]">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[#B9A5C9]/20 p-3 bg-[#46304F]/60">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#F0DFBD] hover:bg-[#46304F] hover:text-[#F7F0E5] transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7ECE6] text-[#29272B]">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#46304F]/25">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 max-w-[85vw] h-full shadow-xl">{sidebarContent}</div>
          <div
            className="flex-1 bg-[#29272B]/65"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#563653]/15 bg-[#F0DFBD]/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg p-2 text-[#563653] hover:bg-[#E9D9C4]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-[#46304F] truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/student/scanner"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#E27D70] px-3.5 py-2 text-xs font-bold text-[#29272B] hover:bg-[#C65D45] hover:text-[#F7F0E5] transition-colors whitespace-nowrap shadow-xs"
            >
              Start New Scan
            </Link>
            <Link
              to="/student/notifications"
              aria-label="View notifications"
              className="relative rounded-lg p-2 text-[#563653] hover:bg-[#E9D9C4] hover:text-[#29272B]"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C65D45] px-1 text-[10px] font-bold text-[#F7F0E5] font-mono-tabular">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/student/profile"
              className="flex items-center gap-2.5 rounded-lg border border-[#563653]/20 bg-[#F7F0E5] px-2.5 py-1.5 hover:bg-[#E9E2F2] transition-colors"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#563653] text-xs font-semibold text-[#F7F0E5]">
                {user?.name?.charAt(0).toUpperCase() || 'C'}
              </span>
              <span className="hidden md:block text-xs font-medium text-[#29272B] max-w-[140px] truncate">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <DemoModeBanner theme="citizen" />
          {children}
        </main>
      </div>
    </div>
  );
}
