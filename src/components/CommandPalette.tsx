import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, ArrowLeftRight, Tag, PiggyBank, BarChart3, TrendingUp,
  Coins, Calculator, FileText, Trophy, Medal, Target, Search,
} from 'lucide-react';

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', group: 'Finance' },
  { label: 'Transactions', icon: ArrowLeftRight, path: '/transactions', group: 'Finance' },
  { label: 'Categories', icon: Tag, path: '/categories', group: 'Finance' },
  { label: 'Budgets', icon: Target, path: '/budgets', group: 'Finance' },
  { label: 'Reports', icon: BarChart3, path: '/reports', group: 'Finance' },
  { label: 'Savings Goals', icon: PiggyBank, path: '/savings', group: 'Finance' },
  { label: 'Savings Challenges', icon: PiggyBank, path: '/savings/challenges', group: 'Finance' },
  { label: 'Interest Calculator', icon: Calculator, path: '/savings/calculator', group: 'Finance' },
  { label: 'Stocks', icon: TrendingUp, path: '/stocks', group: 'Market & Tools' },
  { label: 'Stock Watchlist', icon: TrendingUp, path: '/stocks/watchlist', group: 'Market & Tools' },
  { label: 'Crypto', icon: Coins, path: '/crypto', group: 'Market & Tools' },
  { label: 'Crypto Watchlist', icon: Coins, path: '/crypto/watchlist', group: 'Market & Tools' },
  { label: 'Currency Converter', icon: ArrowLeftRight, path: '/currency', group: 'Market & Tools' },
  { label: 'Bulk Convert', icon: ArrowLeftRight, path: '/currency/bulk', group: 'Market & Tools' },
  { label: 'Tax Calculator', icon: Calculator, path: '/tax', group: 'Market & Tools' },
  { label: 'Tax Comparison', icon: Calculator, path: '/tax/compare', group: 'Market & Tools' },
  { label: 'Tax Brackets', icon: Calculator, path: '/tax/brackets', group: 'Market & Tools' },
  { label: 'Invoices', icon: FileText, path: '/invoices', group: 'Market & Tools' },
  { label: 'Create Invoice', icon: FileText, path: '/invoices/new', group: 'Market & Tools' },
  { label: 'Achievements', icon: Trophy, path: '/achievements', group: 'Gamification' },
  { label: 'Leaderboard', icon: Medal, path: '/leaderboard', group: 'Gamification' },
];

const groups = ['Finance', 'Market & Tools', 'Gamification'];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages... (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, gi) => (
          <div key={group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {routes
                .filter((r) => r.group === group)
                .map((r) => (
                  <CommandItem key={r.path} onSelect={() => go(r.path)} className="cursor-pointer">
                    <r.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{r.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
