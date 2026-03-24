import { useState, useEffect } from 'react';
import api, { formatZAR } from '@/lib/api';
import { ModuleNav } from '@/components/ModuleNav';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CalcResult {
  finalBalance: number;
  totalContributions: number;
  totalInterest: number;
  effectiveRate: number;
  months: number;
  projections: { month: number; balance: number; totalContributions: number; totalInterest: number }[];
}

interface BankRate {
  bankName: string;
  accountType: string;
  rate: number;
}

const savingsNav = [
  { to: '/savings', label: 'Goals' },
  { to: '/savings/challenges', label: 'Challenges' },
  { to: '/savings/calculator', label: 'Calculator' },
];

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const SavingsCalculator = () => {
  const [initial, setInitial] = useState('10000');
  const [monthly, setMonthly] = useState('2000');
  const [rate, setRate] = useState('7.5');
  const [months, setMonths] = useState('60');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [rates, setRates] = useState<BankRate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/savings/interest/rates').then((r) => setRates(Array.isArray(r.data) ? r.data : r.data?.rates || []))
      .catch(() => {});
  }, []);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/savings/interest/calculate?initialAmount=${initial}&monthlyContribution=${monthly}&annualRate=${rate}&months=${months}`);
      setResult(res.data);
    } catch {} finally { setLoading(false); }
  };

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
      <ModuleNav items={savingsNav} />
      <motion.h1 variants={itemV} className="text-2xl font-semibold tracking-tight text-foreground">Interest Calculator</motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Initial Amount (R)</Label><Input type="number" value={initial} onChange={(e) => setInitial(e.target.value)} /></div>
            <div><Label>Monthly Contribution (R)</Label><Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Annual Interest Rate (%)</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className="flex-1" />
                {rates.length > 0 && (
                  <Select onValueChange={(v) => setRate(v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Bank rate" /></SelectTrigger>
                    <SelectContent>
                      {rates.map((r, i) => (
                        <SelectItem key={i} value={String(r.rate)}>{r.bankName} ({r.rate}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div><Label>Months</Label><Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} /></div>
          </div>
          <Button className="w-full" onClick={calculate} disabled={loading}>
            <Calculator className="h-4 w-4 mr-2" />{loading ? 'Calculating...' : 'Calculate'}
          </Button>
        </motion.div>

        {result && (
          <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Results</h2>
            <p className="text-3xl font-bold font-mono text-primary mb-4">{formatZAR(result.finalBalance)}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Contributions</span>
                <p className="font-mono text-foreground">{formatZAR(result.totalContributions)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Interest Earned</span>
                <p className="font-mono text-success">{formatZAR(result.totalInterest)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Effective Rate</span>
                <p className="font-mono text-foreground">{result.effectiveRate}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {result?.projections && result.projections.length > 0 && (
        <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Balance Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={result.projections}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,4%,16%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(240,5%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(240,5%,45%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(240,4%,10%)', border: '1px solid hsl(240,4%,16%)', borderRadius: '8px', fontSize: 12 }}
                formatter={(v: number) => formatZAR(v)} />
              <Line type="monotone" dataKey="balance" stroke="hsl(256,30%,52%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="totalContributions" stroke="hsl(240,5%,45%)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {rates.length > 0 && (
        <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">SA Bank Rates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 font-medium">Bank</th>
                <th className="text-left py-2 font-medium">Account Type</th>
                <th className="text-right py-2 font-medium">Rate</th>
              </tr></thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-2 text-foreground">{r.bankName}</td>
                    <td className="py-2 text-muted-foreground">{r.accountType}</td>
                    <td className="py-2 text-right font-mono text-foreground">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SavingsCalculator;
