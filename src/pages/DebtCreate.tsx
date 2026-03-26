import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { ModuleNav } from '@/components/ModuleNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const debtNav = [
  { to: '/debts', label: 'Dashboard' },
  { to: '/debts/payoff', label: 'Payoff Calculator' },
  { to: '/debts/insights', label: 'Insights' },
];

const debtTypes = [
  { value: 'CreditCard', label: 'Credit Card' },
  { value: 'StoreCard', label: 'Store Card' },
  { value: 'PersonalLoan', label: 'Personal Loan' },
  { value: 'CarFinance', label: 'Car Finance' },
  { value: 'HomeLoan', label: 'Home Loan' },
  { value: 'StudentLoan', label: 'Student Loan' },
  { value: 'Other', label: 'Other' },
];

const rateHints: Record<string, string> = {
  CreditCard: 'Typical SA rate: 18–22%',
  StoreCard: 'Typical SA rate: 18–21%',
  PersonalLoan: 'Typical SA rate: 15–28%',
  CarFinance: 'Typical SA rate: 10–15%',
  HomeLoan: 'Typical SA rate: 11–13%',
  StudentLoan: 'NSFAS: 0%',
};

const DebtCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: '',
    lender: '',
    originalAmount: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    actualPayment: '',
    dueDay: '',
    startDate: '',
    notes: '',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.originalAmount || !form.currentBalance || !form.interestRate || !form.minimumPayment) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/debts', {
        name: form.name,
        type: form.type,
        lender: form.lender || null,
        originalAmount: parseFloat(form.originalAmount),
        currentBalance: parseFloat(form.currentBalance),
        interestRate: parseFloat(form.interestRate),
        minimumPayment: parseFloat(form.minimumPayment),
        actualPayment: form.actualPayment ? parseFloat(form.actualPayment) : parseFloat(form.minimumPayment),
        dueDay: form.dueDay ? parseInt(form.dueDay) : 1,
        startDate: form.startDate || new Date().toISOString().split('T')[0],
        notes: form.notes || null,
      });
      toast({ title: 'Debt added', description: `${form.name} has been added to your tracker` });
      navigate('/debts');
    } catch {
      toast({ title: 'Error', description: 'Failed to add debt', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/debts"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Debt</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your debt details to start tracking</p>
        </div>
      </div>

      <ModuleNav items={debtNav} />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="e.g. FNB Credit Card" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {debtTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Lender</Label>
              <Input placeholder="e.g. FNB, Woolworths" value={form.lender} onChange={(e) => set('lender', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Financial Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Original Amount (R) *</Label>
              <Input type="number" step="0.01" placeholder="15000" value={form.originalAmount} onChange={(e) => set('originalAmount', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current Balance (R) *</Label>
              <Input type="number" step="0.01" placeholder="8500" value={form.currentBalance} onChange={(e) => set('currentBalance', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (% annual) *</Label>
              <Input type="number" step="0.1" placeholder="20.5" value={form.interestRate} onChange={(e) => set('interestRate', e.target.value)} />
              {form.type && rateHints[form.type] && (
                <p className="text-xs text-muted-foreground">{rateHints[form.type]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Minimum Monthly Payment (R) *</Label>
              <Input type="number" step="0.01" placeholder="450" value={form.minimumPayment} onChange={(e) => set('minimumPayment', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Actual Monthly Payment (R)</Label>
              <Input type="number" step="0.01" placeholder="800" value={form.actualPayment} onChange={(e) => set('actualPayment', e.target.value)} />
              <p className="text-xs text-muted-foreground">What you actually pay (can be more than minimum)</p>
            </div>
            <div className="space-y-2">
              <Label>Due Day (1–31)</Label>
              <Input type="number" min="1" max="31" placeholder="25" value={form.dueDay} onChange={(e) => set('dueDay', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Additional</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any additional notes..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Debt'}</Button>
          <Link to="/debts"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
};

export default DebtCreate;
