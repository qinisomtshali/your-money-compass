import { useEffect, useState, useCallback } from 'react';
import api, { formatZAR } from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { ModuleNav } from '@/components/ModuleNav';
import { motion } from 'framer-motion';
import { Zap, TrendingDown, Award, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const debtNav = [
  { to: '/debts', label: 'Dashboard' },
  { to: '/debts/payoff', label: 'Payoff Calculator' },
  { to: '/debts/insights', label: 'Insights' },
];

interface PlanDetails {
  strategy: string;
  totalMonths: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  debtFreeDate: string;
  timeline: { debtName: string; paidOffMonth: number; totalPaid: number }[];
  payoffOrder: string[];
}

interface PayoffData {
  extraMonthlyPayment: number;
  currentPlan: PlanDetails;
  snowball: PlanDetails;
  avalanche: PlanDetails;
  recommendedStrategy: string;
  monthsSavedVsCurrent: number;
  interestSavedVsCurrent: number;
  summary: string;
}

const typeColors: Record<string, string> = {
  CreditCard: '#ef4444', StoreCard: '#f97316', PersonalLoan: '#3b82f6',
  CarFinance: '#a855f7', HomeLoan: '#10b981', StudentLoan: '#14b8a6', Other: '#6b7280',
};

const strategyIcons: Record<string, typeof Zap> = {
  Current: TrendingDown, Snowball: ArrowDown, Avalanche: Zap,
};

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const AnimatedBig = ({ value, prefix = '' }: { value: number; prefix?: string }) => {
  const n = useAnimatedNumber(value);
  return <>{prefix}{n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</>;
};

const DebtPayoff = () => {
  const [extra, setExtra] = useState(0);
  const [data, setData] = useState<PayoffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlan = useCallback(async (amount: number) => {
    try {
      const res = await api.get(`/api/debts/payoff-plan?extraPayment=${amount}`);
      setData(res.data);
      setError('');
    } catch {
      setError('Failed to load payoff plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlan(0); }, [fetchPlan]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPlan(extra), 300);
    return () => clearTimeout(timer);
  }, [extra, fetchPlan]);

  const strategies = data ? [
    { key: 'currentPlan', label: 'Minimum Only', plan: data.currentPlan },
    { key: 'snowball', label: 'Snowball', plan: data.snowball, desc: 'Smallest balance first' },
    { key: 'avalanche', label: 'Avalanche', plan: data.avalanche, desc: 'Highest interest first' },
  ] : [];

  const recommended = data?.recommendedStrategy;

  // Timeline chart data from recommended strategy
  const timelineData = data ? (
    recommended === 'Avalanche' ? data.avalanche : recommended === 'Snowball' ? data.snowball : data.currentPlan
  ).timeline.map((t) => ({
    name: t.debtName,
    months: t.paidOffMonth,
    totalPaid: t.totalPaid,
  })) : [];

  if (loading) return (
    <div>
      <ModuleNav items={debtNav} />
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      </div>
    </div>
  );

  if (error) return (
    <div>
      <ModuleNav items={debtNav} />
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <button onClick={() => { setLoading(true); fetchPlan(extra); }} className="text-primary underline">Retry</button>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Payoff Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">See how extra payments can accelerate your debt freedom</p>
      </div>

      <ModuleNav items={debtNav} />

      <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
        {/* Extra Payment Slider */}
        <motion.div variants={itemV} className="rounded-xl border border-primary/30 bg-gradient-to-br from-card to-primary/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">How much extra can you pay per month?</h2>
              <p className="text-sm text-muted-foreground">Slide to see how extra payments change your payoff timeline</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R</span>
              <Input
                type="number"
                className="w-28"
                value={extra}
                onChange={(e) => setExtra(Math.max(0, Math.min(5000, parseInt(e.target.value) || 0)))}
              />
            </div>
          </div>
          <Slider
            value={[extra]}
            onValueChange={([v]) => setExtra(v)}
            max={5000}
            step={100}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>R0</span><span>R1,000</span><span>R2,000</span><span>R3,000</span><span>R4,000</span><span>R5,000</span>
          </div>
        </motion.div>

        {/* Savings Highlight */}
        {data.monthsSavedVsCurrent > 0 && (
          <motion.div variants={itemV} className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <p className="text-lg">{data.summary}</p>
            <div className="flex justify-center gap-8 mt-4">
              <div>
                <p className="text-3xl font-bold text-emerald-400"><AnimatedBig value={data.monthsSavedVsCurrent} /></p>
                <p className="text-sm text-muted-foreground">months saved</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-400">R<AnimatedBig value={data.interestSavedVsCurrent} /></p>
                <p className="text-sm text-muted-foreground">interest saved</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Strategy Comparison */}
        <motion.div variants={itemV}>
          <h2 className="text-lg font-semibold mb-4">Strategy Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategies.map((s) => {
              const isRec = s.key !== 'currentPlan' && s.plan.strategy === recommended;
              const SIcon = strategyIcons[s.plan.strategy] || Zap;
              return (
                <div
                  key={s.key}
                  className={`rounded-xl border p-6 relative transition-all ${
                    isRec
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card'
                  }`}
                >
                  {isRec && (
                    <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground">
                      <Award className="h-3 w-3 mr-1" /> Recommended
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-4 mt-1">
                    <SIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{s.label}</h3>
                  </div>
                  {s.desc && <p className="text-xs text-muted-foreground mb-4">{s.desc}</p>}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Months to debt-free</span>
                      <span className="font-bold text-lg">{s.plan.totalMonths}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total interest</span>
                      <span className="font-semibold text-red-400">{formatZAR(s.plan.totalInterestPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total paid</span>
                      <span className="font-semibold">{formatZAR(s.plan.totalAmountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Debt-free by</span>
                      <span className="font-semibold">
                        {new Date(s.plan.debtFreeDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Payoff Timeline */}
        {timelineData.length > 0 && (
          <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Payoff Timeline ({recommended} Strategy)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" tick={{ fill: 'hsl(240, 5%, 45%)', fontSize: 12 }} label={{ value: 'Months', position: 'bottom', fill: 'hsl(240, 5%, 45%)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(240, 5%, 70%)', fontSize: 12 }} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(240, 4%, 10%)', border: '1px solid hsl(240, 4%, 16%)', borderRadius: 8 }}
                    labelStyle={{ color: 'hsl(240, 5%, 96%)' }}
                    formatter={(value: number) => [`${value} months`, 'Paid off in']}
                  />
                  <Bar dataKey="months" radius={[0, 6, 6, 0]}>
                    {timelineData.map((_, i) => (
                      <Cell key={i} fill={Object.values(typeColors)[i % Object.values(typeColors).length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Payoff Order */}
        {data.avalanche.payoffOrder.length > 0 && (
          <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Payoff Order ({recommended} Strategy)</h2>
            <div className="space-y-3">
              {((recommended === 'Snowball' ? data.snowball : data.avalanche).payoffOrder).map((name, i) => {
                const tl = (recommended === 'Snowball' ? data.snowball : data.avalanche).timeline.find((t) => t.debtName === name);
                return (
                  <div key={name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{name}</p>
                      {tl && <p className="text-xs text-muted-foreground">Paid off in month {tl.paidOffMonth} • Total: {formatZAR(tl.totalPaid)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DebtPayoff;
