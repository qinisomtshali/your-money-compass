import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatZAR } from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { ModuleNav } from '@/components/ModuleNav';
import { motion } from 'framer-motion';
import { Flag, Plus, CreditCard, Building2, Car, Home, GraduationCap, HelpCircle, ShoppingBag, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface DebtSummary {
  totalDebt: number;
  totalOriginalDebt: number;
  totalMonthlyPayments: number;
  totalPaidOff: number;
  overallProgress: number;
  activeDebts: number;
  paidOffDebts: number;
  debtToIncomeRatio: number;
  estimatedDebtFreeDate: string | null;
  estimatedMonthsToFree: number;
}

interface Debt {
  id: string;
  name: string;
  type: string;
  lender: string | null;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  actualPayment: number;
  dueDay: number;
  startDate: string;
  status: string;
  notes: string | null;
  percentagePaidOff: number;
  totalPaid: number;
  estimatedMonthsToPayoff: number;
  createdAt: string;
}

const debtNav = [
  { to: '/debts', label: 'Dashboard' },
  { to: '/debts/payoff', label: 'Payoff Calculator' },
  { to: '/debts/insights', label: 'Insights' },
];

const typeConfig: Record<string, { color: string; icon: typeof CreditCard }> = {
  CreditCard: { color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: CreditCard },
  StoreCard: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', icon: ShoppingBag },
  PersonalLoan: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: Building2 },
  CarFinance: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: Car },
  HomeLoan: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: Home },
  StudentLoan: { color: 'bg-teal-500/20 text-teal-400 border-teal-500/40', icon: GraduationCap },
  Other: { color: 'bg-muted text-muted-foreground', icon: HelpCircle },
};

const statusColors: Record<string, string> = {
  Active: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  PaidOff: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  Paused: 'bg-muted text-muted-foreground',
};

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const m = months % 12;
  if (years === 0) return `${m} month${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} and ${m} month${m !== 1 ? 's' : ''}`;
}

const AnimatedStat = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const animated = useAnimatedNumber(value);
  return <>{prefix}{animated.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{suffix}</>;
};

const DebtDashboard = () => {
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, debtsRes] = await Promise.all([
          api.get('/api/debts/summary'),
          api.get('/api/debts'),
        ]);
        setSummary(sumRes.data);
        setDebts(debtsRes.data);
      } catch {
        setError('Failed to load debt data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dtiColor = (ratio: number) => {
    if (ratio >= 50) return 'text-red-400';
    if (ratio >= 30) return 'text-orange-400';
    return 'text-emerald-400';
  };

  if (loading) return (
    <div>
      <ModuleNav items={debtNav} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  if (error) return (
    <div>
      <ModuleNav items={debtNav} />
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    </div>
  );

  const noDebts = !summary || (summary.activeDebts === 0 && summary.paidOffDebts === 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debt Payoff Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, strategize, and crush your debt</p>
        </div>
        <Link to="/debts/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Debt</Button>
        </Link>
      </div>

      <ModuleNav items={debtNav} />

      {noDebts ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-16 text-center">
          <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No debts yet — that's great!</h2>
          <p className="text-muted-foreground mb-6">Or add your debts to start planning your payoff journey.</p>
          <Link to="/debts/new"><Button><Plus className="h-4 w-4 mr-1" /> Add Your First Debt</Button></Link>
        </motion.div>
      ) : (
        <motion.div variants={containerV} initial="hidden" animate="visible">
          {/* Summary Cards */}
          <motion.div variants={itemV} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Debt</p>
              <p className="text-2xl font-bold text-red-400">
                R<AnimatedStat value={summary!.totalDebt} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">{summary!.activeDebts} active</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Monthly Payments</p>
              <p className="text-2xl font-bold">{formatZAR(summary!.totalMonthlyPayments)}</p>
              <p className="text-xs text-muted-foreground mt-1">across all debts</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Debt-to-Income</p>
              <p className={`text-2xl font-bold ${dtiColor(summary!.debtToIncomeRatio)}`}>
                <AnimatedStat value={summary!.debtToIncomeRatio} suffix="%" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">{summary!.debtToIncomeRatio < 30 ? 'Healthy' : summary!.debtToIncomeRatio < 50 ? 'Moderate' : 'High risk'}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Debt-Free Date</p>
              <p className="text-xl font-bold">
                {summary!.estimatedDebtFreeDate ? new Date(summary!.estimatedDebtFreeDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) : "You're debt-free!"}
              </p>
              {summary!.estimatedMonthsToFree > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{summary!.estimatedMonthsToFree} months away</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Progress</p>
              <p className="text-2xl font-bold text-emerald-400"><AnimatedStat value={summary!.overallProgress} suffix="%" /></p>
              <Progress value={summary!.overallProgress} className="h-2 mt-2" />
            </div>
          </motion.div>

          {/* Countdown Banner */}
          <motion.div variants={itemV} className="rounded-xl border border-border bg-gradient-to-r from-card to-secondary/30 p-6 mb-6">
            {summary!.estimatedMonthsToFree > 0 ? (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Flag className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    You are <span className="text-primary">{formatMonths(summary!.estimatedMonthsToFree)}</span> away from being debt-free!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatZAR(summary!.totalPaidOff)} paid off so far. Keep going!
                  </p>
                </div>
                <Link to="/debts/payoff">
                  <Button variant="outline" size="sm">See how to get there faster →</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">🎉 You're debt-free! Keep it up!</p>
              </div>
            )}
          </motion.div>

          {/* Debt List */}
          <motion.div variants={itemV}>
            <h2 className="text-lg font-semibold mb-4">Your Debts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {debts.map((debt) => {
                const cfg = typeConfig[debt.type] || typeConfig.Other;
                const Icon = cfg.icon;
                return (
                  <Link key={debt.id} to={`/debts/${debt.id}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors cursor-pointer h-full"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{debt.name}</p>
                            {debt.lender && <p className="text-xs text-muted-foreground">{debt.lender}</p>}
                          </div>
                        </div>
                        <Badge variant="outline" className={statusColors[debt.status] || ''}>
                          {debt.status}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{debt.percentagePaidOff.toFixed(1)}% paid off</span>
                          <span>{formatZAR(debt.currentBalance)} left</span>
                        </div>
                        <Progress value={debt.percentagePaidOff} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Balance</span>
                          <p className="font-medium text-red-400">{formatZAR(debt.currentBalance)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Original</span>
                          <p className="font-medium">{formatZAR(debt.originalAmount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate</span>
                          <p className="font-medium">{debt.interestRate}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment</span>
                          <p className="font-medium">{formatZAR(debt.actualPayment)}/mo</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Due day {debt.dueDay}
                        </div>
                        {debt.estimatedMonthsToPayoff > 0 && (
                          <span className="text-xs text-muted-foreground">{debt.estimatedMonthsToPayoff}mo left</span>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DebtDashboard;
