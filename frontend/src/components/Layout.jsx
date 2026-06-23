import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Wallet, Receipt, ScanLine, Calculator, LogOut } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, testid: 'nav-dashboard' },
  { to: '/income', label: 'Income', icon: Wallet, testid: 'nav-income' },
  { to: '/scan', label: 'Scan Slip', icon: ScanLine, testid: 'nav-scan' },
  { to: '/expenses', label: 'Expenses', icon: Receipt, testid: 'nav-expenses' },
  { to: '/tax', label: 'Tax Summary', icon: Calculator, testid: 'nav-tax' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-page text-charcoal flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-page border-b border-line">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-moss flex items-center justify-center" data-testid="brand-mark">
              <span className="text-page font-heading font-black text-sm">T</span>
            </div>
            <span className="font-heading font-black tracking-tight text-lg" data-testid="brand-title">TaxApp · SARS</span>
          </div>
          <nav className="hidden md:flex items-center gap-1" data-testid="primary-nav">
            {NAV.map(({ to, label, icon: Icon, testid }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                data-testid={testid}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-moss border-b-2 border-moss'
                      : 'text-charcoal-muted hover:text-charcoal border-b-2 border-transparent'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs label-tag">Signed in</div>
              <div className="text-sm font-medium" data-testid="user-email">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              data-testid="logout-btn"
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-line hover:border-charcoal hover:bg-surfaceAlt transition-colors duration-150"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto border-t border-line bg-page" data-testid="mobile-nav">
          {NAV.map(({ to, label, icon: Icon, testid }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-testid={`${testid}-mobile`}
              className={({ isActive }) =>
                `flex-1 min-w-[20%] flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-moss bg-surfaceAlt' : 'text-charcoal-muted'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-10 py-8">
        {children}
      </main>

      <footer className="border-t border-line py-4 text-center text-xs text-charcoal-muted">
        TaxApp · 2024/2025 SARS tax year · Built for South African taxpayers
      </footer>
    </div>
  );
}
