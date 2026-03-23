import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Tag, PiggyBank, BarChart3, LogOut, Menu, X, TrendingUp, Coins, Calculator, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const financeItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const toolsItems = [
  { to: '/stocks', label: 'Stocks', icon: TrendingUp },
  { to: '/crypto', label: 'Crypto', icon: Coins },
  { to: '/currency', label: 'Currency', icon: ArrowLeftRight },
  { to: '/tax', label: 'Tax Calculator', icon: Calculator },
  { to: '/invoices', label: 'Invoices', icon: FileText },
];

const NavItems = ({ items, onClick }: { items: typeof financeItems; onClick?: () => void }) => (
  <>
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-sidebar-accent text-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
          )
        }
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </NavLink>
    ))}
  </>
);

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 left-0 z-30 border-r border-border bg-sidebar backdrop-blur-md">
        <div className="p-6">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            <span className="text-primary">●</span> Ledger
          </h1>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <NavItems items={financeItems} />
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market & Tools</p>
          </div>
          <NavItems items={toolsItems} />
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user?.firstName} {user?.lastName}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-background/80 backdrop-blur border-b border-border flex items-center px-4">
        <button onClick={() => setMobileOpen(true)} className="text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="ml-3 text-sm font-semibold">
          <span className="text-primary">●</span> Ledger
        </h1>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 bg-sidebar border-r border-border flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <h1 className="text-lg font-semibold"><span className="text-primary">●</span> Ledger</h1>
              <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              <NavItems items={financeItems} onClick={() => setMobileOpen(false)} />
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market & Tools</p>
              </div>
              <NavItems items={toolsItems} onClick={() => setMobileOpen(false)} />
            </nav>
            <div className="p-3 border-t border-border">
              <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
};
