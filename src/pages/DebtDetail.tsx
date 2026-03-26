import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { formatZAR } from '@/lib/api';
import { CardSkeleton, TableSkeleton } from '@/components/Skeleton';
import { ModuleNav } from '@/components/ModuleNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, ShoppingBag, Building2, Car, Home, GraduationCap, HelpCircle, Banknote, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

const debtNav = [
  { to: '/debts', label: 'Dashboard' },
  { to: '/debts/payoff', label: 'Payoff Calculator' },
  { to: '/debts/insights', label: 'Insights' },
];

interface Debt {
  id: string; name: string; type: string; lender: string | null; originalAmount: number; currentBalance: number;
  interestRate: number; minimumPayment: number; actualPayment: number; dueDay: number; startDate: string;
  status: string; notes: string | null; percentagePaidOff: number; totalPaid: number; estimatedMonthsToPayoff: number;
}

interface Payment {
  id: string; amount: number; date: string; note: string | null; balanceAfter: number;
}

const typeConfig: Record<string, { color: string; icon: typeof CreditCard; label: string }> = {
  CreditCard: { color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: CreditCard, label: 'Credit Card' },
  StoreCard: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', icon: ShoppingBag, label: 'Store Card' },
  PersonalLoan: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: Building2, label: 'Personal Loan' },
  CarFinance: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: Car, label: 'Car Finance' },
  HomeLoan: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: Home, label: 'Home Loan' },
  StudentLoan: { color: 'bg-teal-500/20 text-teal-400 border-teal-500/40', icon: GraduationCap, label: 'Student Loan' },
  Other: { color: 'bg-muted text-muted-foreground', icon: HelpCircle, label: 'Other' },
};

const statusColors: Record<string, string> = {
  Active: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  PaidOff: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  Paused: 'bg-muted text-muted-foreground',
};

const DebtDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        api.get(`/api/debts/${id}`),
        api.get(`/api/debts/${id}/payments`),
      ]);
      setDebt(dRes.data);
      setPayments(pRes.data);
      setPayAmount(String(dRes.data.actualPayment));
    } catch {
      toast({ title: 'Error', description: 'Failed to load debt', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const logPayment = async () => {
    if (!payAmount) return;
    setPaying(true);
    try {
      const res = await api.post(`/api/debts/${id}/payments`, {
        amount: parseFloat(payAmount),
        note: payNote || null,
      });
      const data = res.data;
      if (data.debtPaidOff) {
        toast({ title: `🎉 You paid off ${debt!.name}!`, description: `+${data.pointsEarned} points earned!` });
      } else {
        toast({ title: 'Payment logged!', description: `+${data.pointsEarned} points. Balance: ${formatZAR(data.newBalance)}` });
      }
      setPayOpen(false);
      setPayNote('');
      load();
    } catch {
      toast({ title: 'Error', description: 'Failed to log payment', variant: 'destructive' });
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/debts/${id}`);
      toast({ title: 'Debt deleted' });
      navigate('/debts');
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const markPaidOff = async () => {
    try {
      await api.patch(`/api/debts/${id}/status`, { status: 'PaidOff' });
      toast({ title: `🎉 ${debt!.name} marked as paid off!` });
      load();
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  if (loading) return (
    <div>
      <ModuleNav items={debtNav} />
      <CardSkeleton /><div className="mt-4"><TableSkeleton /></div>
    </div>
  );

  if (!debt) return (
    <div>
      <ModuleNav items={debtNav} />
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Debt not found</p>
        <Link to="/debts"><Button variant="outline" className="mt-4">Back to Debts</Button></Link>
      </div>
    </div>
  );

  const cfg = typeConfig[debt.type] || typeConfig.Other;
  const Icon = cfg.icon;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/debts"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{debt.name}</h1>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
            <Badge variant="outline" className={statusColors[debt.status] || ''}>{debt.status}</Badge>
          </div>
          {debt.lender && <p className="text-sm text-muted-foreground mt-1">{debt.lender}</p>}
        </div>
      </div>

      <ModuleNav items={debtNav} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Info Cards */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cfg.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-red-400">{formatZAR(debt.currentBalance)}</p>
              <p className="text-sm text-muted-foreground">of {formatZAR(debt.originalAmount)} original</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>{debt.percentagePaidOff.toFixed(1)}% paid off</span>
              <span>{formatZAR(debt.totalPaid)} paid</span>
            </div>
            <Progress value={debt.percentagePaidOff} className="h-3" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Interest Rate</span><p className="font-semibold">{debt.interestRate}%</p></div>
            <div><span className="text-muted-foreground">Monthly Payment</span><p className="font-semibold">{formatZAR(debt.actualPayment)}</p></div>
            <div><span className="text-muted-foreground">Min Payment</span><p className="font-semibold">{formatZAR(debt.minimumPayment)}</p></div>
            <div><span className="text-muted-foreground">Due Day</span><p className="font-semibold">{debt.dueDay}</p></div>
          </div>
          {debt.estimatedMonthsToPayoff > 0 && (
            <p className="text-sm text-muted-foreground mt-3">Estimated payoff in {debt.estimatedMonthsToPayoff} months</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogTrigger asChild>
              <Button><Banknote className="h-4 w-4 mr-1" /> Log Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Payment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (R)</Label>
                  <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Note (optional)</Label>
                  <Input placeholder="e.g. Extra payment this month" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
                </div>
                <Button onClick={logPayment} disabled={paying} className="w-full">
                  {paying ? 'Logging...' : 'Log Payment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {debt.status === 'Active' && (
            <Button variant="outline" onClick={markPaidOff}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Paid Off
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {debt.name}?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently remove this debt and all its payment history.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Payment History */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-6 pb-3">
            <h2 className="font-semibold">Payment History</h2>
          </div>
          {payments.length === 0 ? (
            <div className="p-6 pt-0 text-center text-muted-foreground text-sm">No payments logged yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.date).toLocaleDateString('en-ZA')}</TableCell>
                    <TableCell className="font-medium text-emerald-400">{formatZAR(p.amount)}</TableCell>
                    <TableCell>{formatZAR(p.balanceAfter)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.note || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DebtDetail;
