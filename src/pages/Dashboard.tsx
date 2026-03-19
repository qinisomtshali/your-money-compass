import { useEffect, useState } from 'react';
import api, { formatZAR, type MonthlySummary, type CategoryBreakdown, type BudgetVsActual, type Transaction } from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['hsl(256,30%,52%)', 'hsl(152,60%,45%)', 'hsl(38,92%,50%)', 'hsl(200,80%,50%)', 'hsl(340,65%,55%)', 'hsl(280,50%,55%)', 'hsl(170,60%,40%)'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, ease: [0.2, 0, 0, 1] } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0, 0, 1] } },
};

const Dashboard = () => {
  const now = new Date();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    Promise.all([
      api.get(`/api/reports/monthly-summary?month=${month}&year=${year}`),
      api.get(`/api/reports/category-breakdown?month=${month}&year=${year}`),
      api.get(`/api/reports/budget-vs-actual?month=${month}&year=${year}`),
      api.get(`/api/transactions?page=1&pageSize=5`),
    ]).then(([s, b, bva, tx]) => {
      setSummary(s.data);
      setBreakdown(b.data);
      setBudgetVsActual(bva.data);
      setRecentTx(tx.data.items || tx.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Income', value: summary?.totalIncome ?? 0, icon: TrendingUp, color: 'text-success' },
    { label: 'Total Expenses', value: summary?.totalExpenses ?? 0, icon: TrendingDown, color: 'text-destructive' },
    { label: 'Net Amount', value: summary?.netAmount ?? 0, icon: Wallet, color: (summary?.netAmount ?? 0) >= 0 ? 'text-success' : 'text-destructive' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.h1 variants={itemVariants} className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</motion.h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className={`text-3xl font-semibold font-mono tabular-nums mt-2 ${card.color}`}>
              {formatZAR(card.value)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Spending by Category</h2>
          {breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No spending data for this month.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={80} strokeWidth={0}>
                    {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {breakdown.map((item, i) => (
                  <div key={item.categoryId} className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground flex-1 truncate">{item.categoryName}</span>
                    <span className="font-mono tabular-nums text-foreground">{item.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Budget vs Actual</h2>
          {budgetVsActual.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No budgets set for this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetVsActual} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,4%,16%)" />
                <XAxis dataKey="categoryName" tick={{ fontSize: 11, fill: 'hsl(240,5%,45%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(240,5%,45%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(240,4%,10%)', border: '1px solid hsl(240,4%,16%)', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: 'hsl(240,5%,96%)' }}
                  formatter={(value: number) => formatZAR(value)}
                />
                <Bar dataKey="budgetAmount" name="Budget" fill="hsl(256,30%,52%)" radius={[4,4,0,0]} />
                <Bar dataKey="actualAmount" name="Actual" fill="hsl(152,60%,45%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Recent Transactions</h2>
        {recentTx.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No transactions found. A fresh start.</p>
        ) : (
          <div className="space-y-1">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('en-ZA')} · {tx.category?.name || tx.categoryName || ''}</p>
                </div>
                <span className={`font-mono tabular-nums text-sm font-medium ${tx.type === 1 ? 'text-success' : 'text-foreground'}`}>
                  {tx.type === 1 ? '+' : '-'}{formatZAR(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
