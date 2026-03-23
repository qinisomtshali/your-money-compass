import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleNav } from '@/components/ModuleNav';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface Scenario {
  label: string;
  grossIncome: string;
  age: string;
  retirementContributions: string;
  medicalAidMembers: string;
}

interface CompareResult {
  label: string;
  grossIncome: number;
  totalTax: number;
  effectiveTaxRate: number;
  monthlyNetIncome: number;
}

const NAV = [
  { to: '/tax', label: 'Calculator' },
  { to: '/tax/compare', label: 'Compare' },
  { to: '/tax/brackets', label: 'Brackets' },
];

const emptyScenario = (): Scenario => ({ label: '', grossIncome: '', age: '30', retirementContributions: '0', medicalAidMembers: '0' });

const TaxCompare = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { ...emptyScenario(), label: 'Current', grossIncome: '400000' },
    { ...emptyScenario(), label: 'Raise', grossIncome: '550000' },
  ]);
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);

  const update = (i: number, field: keyof Scenario, val: string) => {
    const next = [...scenarios];
    next[i] = { ...next[i], [field]: val };
    setScenarios(next);
  };

  const add = () => {
    if (scenarios.length >= 5) return;
    setScenarios([...scenarios, emptyScenario()]);
  };

  const remove = (i: number) => {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter((_, idx) => idx !== i));
  };

  const compare = async () => {
    const valid = scenarios.filter((s) => s.grossIncome);
    if (valid.length < 2) { toast.error('Add at least 2 scenarios'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/tax/compare', {
        scenarios: valid.map((s) => ({
          grossIncome: Number(s.grossIncome),
          age: Number(s.age),
          label: s.label || 'Untitled',
          retirementContributions: Number(s.retirementContributions) * 12,
          medicalAidMembers: Number(s.medicalAidMembers),
        })),
      });
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch { toast.error('Comparison failed'); }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">SA Tax Calculator</h1>
      <p className="text-muted-foreground text-sm mb-6">Calculate your South African income tax</p>
      <ModuleNav items={NAV} />

      <div className="space-y-4 mb-6">
        {scenarios.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Scenario {i + 1}</span>
                {scenarios.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div><Label>Label</Label><Input value={s.label} onChange={(e) => update(i, 'label', e.target.value)} placeholder="Scenario name" /></div>
                <div><Label>Gross Income (R) *</Label><Input type="number" value={s.grossIncome} onChange={(e) => update(i, 'grossIncome', e.target.value)} /></div>
                <div><Label>Age</Label><Input type="number" value={s.age} onChange={(e) => update(i, 'age', e.target.value)} /></div>
                <div><Label>Monthly Retirement (R)</Label><Input type="number" value={s.retirementContributions} onChange={(e) => update(i, 'retirementContributions', e.target.value)} /></div>
                <div><Label>Med Aid Members</Label><Input type="number" value={s.medicalAidMembers} onChange={(e) => update(i, 'medicalAidMembers', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        {scenarios.length < 5 && (
          <Button variant="outline" onClick={add}><Plus className="h-4 w-4 mr-2" /> Add Scenario</Button>
        )}
        <Button onClick={compare} disabled={loading}>
          {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
          Compare
        </Button>
      </div>

      {results.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
            {results.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <p className="font-semibold mb-2">{r.label}</p>
                  <p className="text-xs text-muted-foreground">Gross: {formatZAR(r.grossIncome)}</p>
                  <p className="text-xs text-red-500 mt-1">Tax: {formatZAR(r.totalTax)} ({r.effectiveTaxRate?.toFixed(1)}%)</p>
                  <p className="text-lg font-bold text-primary mt-2">{formatZAR(r.monthlyNetIncome)}/mo</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Monthly Net Income Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="monthlyNetIncome" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TaxCompare;
