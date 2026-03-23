import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModuleNav } from '@/components/ModuleNav';
import { Calculator, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface TaxResult {
  taxYear?: string;
  grossIncome: number;
  taxableIncome: number;
  retirementDeduction?: number;
  taxAmount: number;
  effectiveRate: number;
  monthlyPaye: number;
  monthlyNetIncome: number;
  rebates?: number;
  medicalAidCredits?: number;
  bracketBreakdown?: Array<{ bracketRange: string; rate: number; taxableInBracket: number; taxInBracket: number }>;
}

const NAV = [
  { to: '/tax', label: 'Calculator' },
  { to: '/tax/compare', label: 'Compare' },
  { to: '/tax/brackets', label: 'Brackets' },
];

const DONUT_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

const TaxResults = ({ result }: { result: TaxResult }) => {
  const donutData = [
    { name: 'Tax', value: result.taxAmount },
    { name: 'Net Income', value: result.grossIncome - result.taxAmount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        {result.taxYear && <Badge variant="secondary">{result.taxYear}</Badge>}
        <Badge variant="outline">{result.effectiveRate?.toFixed(1)}% effective rate</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gross Income</p><p className="text-lg font-bold">{formatZAR(result.grossIncome)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Taxable Income</p><p className="text-lg font-bold">{formatZAR(result.taxableIncome)}</p></CardContent></Card>
        {result.retirementDeduction != null && (
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Retirement Deduction</p><p className="text-lg font-bold">{formatZAR(result.retirementDeduction)}</p></CardContent></Card>
        )}
        <Card className="border-destructive/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Tax</p><p className="text-2xl font-bold text-red-500">{formatZAR(result.taxAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Monthly PAYE</p><p className="text-lg font-bold">{formatZAR(result.monthlyPaye)}</p></CardContent></Card>
        <Card className="border-primary/30 bg-primary/5"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Monthly Take-Home</p><p className="text-2xl font-bold text-primary">{formatZAR(result.monthlyNetIncome)}</p></CardContent></Card>
      </div>

      {(result.rebates != null || result.medicalAidCredits != null) && (
        <div className="flex gap-4 flex-wrap text-sm">
          {result.rebates != null && <p><span className="text-muted-foreground">Rebates:</span> <span className="font-medium">{formatZAR(result.rebates)}</span></p>}
          {result.medicalAidCredits != null && <p><span className="text-muted-foreground">Medical Aid Credits:</span> <span className="font-medium">{formatZAR(result.medicalAidCredits)}</span></p>}
        </div>
      )}

      {/* Donut Chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Tax vs Net Income</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> Tax</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-muted" /> Net Income</span>
          </div>
        </CardContent>
      </Card>

      {/* Brackets */}
      {result.bracketBreakdown && result.bracketBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Bracket Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bracket</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Taxable in Bracket</TableHead>
                    <TableHead className="text-right">Tax in Bracket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.bracketBreakdown.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell>{b.bracketRange}</TableCell>
                      <TableCell className="text-right">{b.rate}%</TableCell>
                      <TableCell className="text-right">{formatZAR(b.taxableInBracket)}</TableCell>
                      <TableCell className="text-right">{formatZAR(b.taxInBracket)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Tax = () => {
  const [form, setForm] = useState({ grossIncome: '', age: '30', retirementContributions: '0', medicalAidMembers: '0' });
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [estimateResult, setEstimateResult] = useState<TaxResult | null>(null);
  const [estimating, setEstimating] = useState(false);

  const calculate = async () => {
    if (!form.grossIncome) { toast.error('Enter gross income'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/tax/calculate', {
        grossIncome: Number(form.grossIncome),
        age: Number(form.age),
        retirementContributions: Number(form.retirementContributions) * 12,
        medicalAidMembers: Number(form.medicalAidMembers),
      });
      setResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  };

  const estimate = async () => {
    if (!monthlySalary) { toast.error('Enter monthly salary'); return; }
    setEstimating(true);
    try {
      const { data } = await api.get(`/api/tax/estimate?monthlySalary=${monthlySalary}&age=30`);
      setEstimateResult(data);
    } catch { toast.error('Estimate failed'); }
    setEstimating(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">SA Tax Calculator</h1>
      <p className="text-muted-foreground text-sm mb-6">Calculate your South African income tax</p>
      <ModuleNav items={NAV} />

      <Tabs defaultValue="calculator">
        <TabsList className="mb-6">
          <TabsTrigger value="calculator">Full Calculator</TabsTrigger>
          <TabsTrigger value="estimate">Quick Estimate</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Annual Gross Income (R) *</Label><Input type="number" value={form.grossIncome} onChange={(e) => setForm({ ...form, grossIncome: e.target.value })} placeholder="500000" /></div>
                <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
                <div><Label>Monthly Retirement Contributions (R)</Label><Input type="number" value={form.retirementContributions} onChange={(e) => setForm({ ...form, retirementContributions: e.target.value })} /></div>
                <div><Label>Medical Aid Members</Label><Input type="number" value={form.medicalAidMembers} onChange={(e) => setForm({ ...form, medicalAidMembers: e.target.value })} placeholder="0 = none" /></div>
              </div>
              <Button onClick={calculate} disabled={loading} className="mt-4">
                {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                <Calculator className="h-4 w-4 mr-2" /> Calculate Tax
              </Button>
            </CardContent>
          </Card>
          {result && <TaxResults result={result} />}
        </TabsContent>

        <TabsContent value="estimate">
          <Card className="mb-6">
            <CardContent className="p-6">
              <Label>What's your monthly salary? (R)</Label>
              <div className="flex gap-3 mt-2">
                <Input type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} placeholder="50000" className="max-w-xs" />
                <Button onClick={estimate} disabled={estimating}>
                  {estimating && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                  Estimate
                </Button>
              </div>
            </CardContent>
          </Card>
          {estimateResult && <TaxResults result={estimateResult} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tax;
