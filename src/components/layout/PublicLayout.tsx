import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../common/RiskDisplay';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/features', label: 'Features' },
  { to: '/#why-jobshield', label: 'Why JOBSHIELD', isHash: true },
  { to: '/safety-guide', label: 'Safety Guide' },
  { to: '/about', label: 'About Us' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardPath = user?.role === 'ADMIN' ? '/admin/overview' : '/student/dashboard';

  const handleHashClick = (e: React.MouseEvent, target: string) => {
    setMobileOpen(false);
    if (location.pathname === '/' && target === '/#why-jobshield') {
      e.preventDefault();
      document.getElementById('why-jobshield')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F0E5] text-[#29272B]">
      <header className="sticky top-0 z-40 border-b border-[#842D48]/50 bg-[#651F35] text-[#F0DFBD] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 h-16">
          <Link
            to="/"
            className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E27D70]"
          >
            <BrandLogo variant="burgundy" />
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#F0DFBD]">
            {NAV_ITEMS.map((item) =>
              item.isHash ? (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={(e) => handleHashClick(e, item.to)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    location.pathname === '/' && location.hash === '#why-jobshield'
                      ? 'border-[#E27D70] text-[#F7F0E5] font-semibold'
                      : 'border-transparent hover:text-[#F7F0E5] hover:border-[#E27D70]/70'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                      isActive && !(item.to === '/' && location.hash === '#why-jobshield')
                        ? 'border-[#E27D70] text-[#F7F0E5] font-semibold'
                        : 'border-transparent text-[#F0DFBD] hover:text-[#F7F0E5] hover:border-[#E27D70]/70'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="rounded-lg bg-[#C65D45] px-4 py-2 text-sm font-semibold text-[#F7F0E5] hover:bg-[#B85C32] transition-colors whitespace-nowrap shrink-0"
              >
                Open Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-sm font-semibold text-[#F0DFBD] hover:text-[#F7F0E5] px-3 py-2 whitespace-nowrap shrink-0 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signin"
                  className="rounded-lg bg-[#C65D45] px-5 py-2.5 text-sm font-bold text-[#FFFDF8] hover:bg-[#D46B52] border border-[#F0DFBD]/45 shadow-md shadow-[#29272B]/30 transition-colors whitespace-nowrap shrink-0"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden rounded-lg p-2 text-[#F0DFBD] hover:bg-[#842D48] hover:text-[#F7F0E5]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-[#842D48]/50 bg-[#56192C] px-4 py-4 space-y-2">
            {NAV_ITEMS.map((item) =>
              item.isHash ? (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={(e) => handleHashClick(e, item.to)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#F0DFBD] hover:bg-[#842D48] hover:text-[#F7F0E5]"
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-[#C65D45] text-[#F7F0E5]'
                        : 'text-[#F0DFBD] hover:bg-[#842D48] hover:text-[#F7F0E5]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
            <div className="pt-3 border-t border-[#842D48]/45 flex flex-col gap-2">
              {user ? (
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg bg-[#C65D45] px-4 py-2.5 text-center text-sm font-semibold text-[#F7F0E5]"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-lg border border-[#F0DFBD]/35 px-4 py-2.5 text-center text-sm font-semibold text-[#F0DFBD]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-lg bg-[#C65D45] px-4 py-2.5 text-center text-sm font-semibold text-[#F7F0E5]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#842D48]/40 bg-gradient-to-b from-[#29272B] to-[#651F35] text-[#E9D9C4]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <BrandLogo variant="burgundy" />
              <p className="text-sm text-[#E9D9C4]/90 max-w-md leading-relaxed">
                Protect Your Career Before Scammers Destroy It. An AI-powered recruitment trust and
                protection platform helping citizens, students, and graduates verify opportunities
                with explainable evidence.
              </p>
              <p className="text-xs text-[#F0DFBD]/80">
                Team Tech Dynamites — Vedant Dalvi &amp; Prince Gupta
              </p>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-[#F0DFBD] mb-3">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-[#F7F0E5] transition-colors">
                    About JOBSHIELD
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-[#F7F0E5] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-[#F7F0E5] transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/safety-guide" className="hover:text-[#F7F0E5] transition-colors">
                    Safety Guide
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#F7F0E5] transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-[#F0DFBD] mb-3">
                Access &amp; Policies
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="hover:text-[#F7F0E5] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#F7F0E5] transition-colors">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/signin" className="hover:text-[#F7F0E5] transition-colors">
                    Workspace Selection &amp; Demo
                  </Link>
                </li>
                <li>
                  <Link to="/signin/student" className="hover:text-[#F7F0E5] transition-colors">
                    Citizen / Student Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#F7F0E5] transition-colors">
                    Create Citizen Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-[#E9D9C4]/20 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-[#E9D9C4]/85">
            <p>
              Disclaimer: JOBSHIELD provides evidence-based risk analysis and guidance. It does not
              guarantee employment authenticity or recover lost funds. For cyber financial fraud in
              India, call 1930 or visit cybercrime.gov.in.
            </p>
            <p className="whitespace-nowrap shrink-0 text-[#F0DFBD]">
              &copy; {new Date().getFullYear()} JOBSHIELD · Tech Dynamites
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
