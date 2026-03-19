import { useEffect, useState } from 'react';
import api, { formatZAR, type MonthlySummary, type CategoryBreakdown, type BudgetVsActual } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { CardSkeleton } from '@/components/Skeleton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const COLORS = ['hsl(256,30%,52%)', 'hsl(152,60%,45%)', 'hsl(38,92%,50%)', 'hsl(200,80%,50%)', 'hsl(340,65%,55%)', 'hsl(280,50%,55%)', 'hsl(170,60%,40%)'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] as const } },
};

const Reports = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/reports/monthly-summary?month=${month}&year=${year}`),
      api.get(`/api/reports/category-breakdown?month=${month}&year=${year}`),
      api.get(`/api/reports/budget-vs-actual?month=${month}&year=${year}`),
    ]).then(([s, b, bva]) => {
      setSummary(s.data);
      setBreakdown(b.data);
      setBudgetVsActual(bva.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [month, year]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <div className="flex items-center gap-3">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="h-9 w-28 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-20 bg-secondary/50 border-border text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="space-y-8">
          {/* Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Income', value: summary?.totalIncome ?? 0, icon: TrendingUp, color: 'text-success' },
              { label: 'Total Expenses', value: summary?.totalExpenses ?? 0, icon: TrendingDown, color: 'text-destructive' },
              { label: 'Net Amount', value: summary?.netAmount ?? 0, icon: Wallet, color: (summary?.netAmount ?? 0) >= 0 ? 'text-success' : 'text-destructive' },
            ].map((card) => (
              <motion.div key={card.label} variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className={`text-3xl font-semibold font-mono tabular-nums mt-2 ${card.color}`}>{formatZAR(card.value)}</p>
              </motion.div>
            ))}
          </div>

          {/* Category Breakdown */}
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Category Breakdown</h2>
            {breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data for this period.</p>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ResponsiveContainer width={250} height={250}>
                  <PieChart>
                    <Pie data={breakdown} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={100} strokeWidth={0}>
                      {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 w-full">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-xs text-muted-foreground font-medium">Category</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">Amount</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">%</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">Txns</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((item, i) => (
                        <tr key={item.categoryId} className="border-b border-border/30">
                          <td className="py-2.5 flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-foreground">{item.categoryName}</span>
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-foreground">{formatZAR(item.amount)}</td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-muted-foreground">{item.percentage.toFixed(1)}%</td>
                          <td className="py-2.5 text-right text-muted-foreground">{item.transactionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>

          {/* Budget vs Actual */}
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Budget vs Actual</h2>
            {budgetVsActual.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No budgets set for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetVsActual} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,4%,16%)" />
                  <XAxis dataKey="categoryName" tick={{ fontSize: 11, fill: 'hsl(240,5%,45%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(240,5%,45%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(240,4%,10%)', border: '1px solid hsl(240,4%,16%)', borderRadius: '8px', fontSize: 12 }}
                    labelStyle={{ color: 'hsl(240,5%,96%)' }}
                    formatter={(value: number) => formatZAR(value)}
                  />
                  <Bar dataKey="budgetAmount" name="Budget" fill="hsl(256,30%,52%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualAmount" name="Actual" fill="hsl(152,60%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Reports;
