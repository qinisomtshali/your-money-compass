import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { formatZAR } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingDown, PiggyBank, Wallet, Repeat, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeekBill {
  name: string;
  amount: number;
  dueDay: number;
  isDebtPayment: boolean;
  isSavingsTransfer: boolean;
}

interface WeekBreakdown {
  week: number;
  bills: WeekBill[];
  totalDue: number;
}

interface PaydayData {
  monthlyIncome: number;
  salaryDay: number;
  totalBills: number;
  totalDebtPayments: number;
  totalSavings: number;
  totalEssentials: number;
  spendingMoney: number;
  spendingMoneyPerDay: number;
  spendingMoneyPerWeek: number;
  billsPercentage: number;
  weeklyBreakdown: WeekBreakdown[];
}

const SubNav = () => {
  const navigate = useNavigate();
  return (
    <Tabs value="payday" onValueChange={(v) => {
      const routes: Record<string, string> = { bills: '/recurring', calendar: '/recurring/calendar', upcoming: '/recurring/upcoming', payday: '/recurring/payday' };
      navigate(routes[v]);
    }}>
      <TabsList className="mb-6">
        <TabsTrigger value="bills">My Bills</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="payday">Payday Plan</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

const CHART_COLORS = ['hsl(0, 72%, 51%)', 'hsl(38, 92%, 50%)', 'hsl(152, 60%, 45%)', 'hsl(256, 30%, 52%)'];

export default function PaydayPlanner() {
  const [salaryDay, setSalaryDay] = useState(25);
  const [debouncedDay, setDebouncedDay] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDay(salaryDay), 300);
    return () => clearTimeout(t);
  }, [salaryDay]);

  const { data, isLoading } = useQuery<PaydayData>({
    queryKey: ['payday-plan', debouncedDay],
    queryFn: () => api.get(`/api/recurring/payday-plan?salaryDay=${debouncedDay}`).then(r => r.data),
  });

  const pieData = data ? [
    { name: 'Essential Bills', value: data.totalEssentials },
    { name: 'Debt Payments', value: data.totalDebtPayments },
    { name: 'Savings', value: data.totalSavings },
    { name: 'Spending Money', value: data.spendingMoney },
  ].filter(d => d.value > 0) : [];

  const barData = data?.weeklyBreakdown?.map(w => ({ name: `Week ${w.week}`, total: w.totalDue })) || [];

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">Bills & Recurring</h1>
        <p className="text-muted-foreground text-sm mt-1">See where your salary goes</p>
      </div>

      <SubNav />

      {/* Salary day input */}
      <Card className="mb-6">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Label className="text-foreground font-medium whitespace-nowrap">When do you get paid?</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Day</span>
            <Input type="number" min={1} max={31} value={salaryDay} onChange={e => setSalaryDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))} className="w-20" />
            <span className="text-muted-foreground text-sm">of each month</span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
          <Skeleton className="h-64" />
        </div>
      ) : !data || data.monthlyIncome === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No payday data yet</h3>
          <p className="text-muted-foreground text-sm">Add your recurring income and expenses to see your payday breakdown.</p>
        </CardContent></Card>
      ) : (
        <>
          {/* Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-400" /><p className="text-xs text-muted-foreground">Monthly Income</p></div>
                <p className="text-2xl font-bold text-green-400">{formatZAR(data.monthlyIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1"><Repeat className="h-4 w-4 text-destructive" /><p className="text-xs text-muted-foreground">Total Bills</p></div>
                <p className="text-2xl font-bold text-destructive">{formatZAR(data.totalBills)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1"><CreditCard className="h-4 w-4 text-amber-400" /><p className="text-xs text-muted-foreground">Debt Payments</p></div>
                <p className="text-2xl font-bold text-amber-400">{formatZAR(data.totalDebtPayments)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1"><PiggyBank className="h-4 w-4 text-green-400" /><p className="text-xs text-muted-foreground">Savings</p></div>
                <p className="text-2xl font-bold text-green-400">{formatZAR(data.totalSavings)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Essential Bills</p></div>
                <p className="text-2xl font-bold text-foreground">{formatZAR(data.totalEssentials)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1"><p className="text-xs text-muted-foreground">Bills %</p></div>
                <p className="text-2xl font-bold text-foreground">{data.billsPercentage.toFixed(1)}%</p>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, data.billsPercentage)}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* HERO: Spending Money */}
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">💸 Your Spending Money</p>
              <p className={cn("text-5xl font-extrabold tracking-tight", data.spendingMoney >= 0 ? 'text-green-400' : 'text-destructive')}>
                {formatZAR(data.spendingMoney)}
              </p>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
                <span><strong className="text-foreground">{formatZAR(data.spendingMoneyPerDay)}</strong> / day</span>
                <span><strong className="text-foreground">{formatZAR(data.spendingMoneyPerWeek)}</strong> / week</span>
              </div>
            </CardContent>
          </Card>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Pie */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Salary Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatZAR(value)} contentStyle={{ backgroundColor: 'hsl(240, 4%, 10%)', border: '1px solid hsl(240, 4%, 16%)', borderRadius: '8px', color: 'hsl(240, 5%, 96%)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bar */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Bills Per Week</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(240, 5%, 45%)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(240, 5%, 45%)', fontSize: 12 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatZAR(value)} contentStyle={{ backgroundColor: 'hsl(240, 4%, 10%)', border: '1px solid hsl(240, 4%, 16%)', borderRadius: '8px', color: 'hsl(240, 5%, 96%)' }} />
                    <Bar dataKey="total" fill="hsl(256, 30%, 52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Weekly Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.weeklyBreakdown?.map(week => (
                  <div key={week.week}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Week {week.week} <span className="text-muted-foreground font-normal">({(week.week - 1) * 7 + 1}–{Math.min(week.week * 7, 31)})</span>
                      </span>
                      <span className={cn("text-sm font-bold", week.totalDue > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                        {week.totalDue > 0 ? formatZAR(week.totalDue) : 'No bills'}
                      </span>
                    </div>
                    {week.bills.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {week.bills.map((bill, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{bill.name}</span>
                              {bill.isDebtPayment && <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">Debt</Badge>}
                              {bill.isSavingsTransfer && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/30">Savings</Badge>}
                            </div>
                            <span className="text-destructive">{formatZAR(bill.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
