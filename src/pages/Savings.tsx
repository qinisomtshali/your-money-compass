import { useEffect, useState } from 'react';
import api, { formatZAR } from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { ModuleNav } from '@/components/ModuleNav';
import { motion } from 'framer-motion';
import { PiggyBank, Target, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface SavingsSummary {
  totalSaved: number;
  totalTargets: number;
  overallProgress: number;
  activeGoals: number;
  completedGoals: number;
  activeChallenges: number;
  emergencyFundBalance: number;
  emergencyFundTarget: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  monthlyContribution: number;
  priority: string;
  status: string;
  targetDate: string | null;
  estimatedMonthsToGoal: number | null;
  createdAt: string;
}

const priorityColors: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-blue-500/20 text-blue-400',
  High: 'bg-orange-500/20 text-orange-400',
  Critical: 'bg-destructive/20 text-destructive',
};

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const savingsNav = [
  { to: '/savings', label: 'Goals' },
  { to: '/savings/challenges', label: 'Challenges' },
  { to: '/savings/calculator', label: 'Calculator' },
];

const Savings = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState<SavingsGoal | null>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [form, setForm] = useState({ name: '', icon: '🎯', color: '#8B5CF6', targetAmount: '', monthlyContribution: '', priority: 'Medium', targetDate: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/savings/summary').catch(() => ({ data: null })),
      api.get('/api/savings/goals').catch(() => ({ data: [] })),
    ]).then(([s, g]) => {
      setSummary(s.data);
      setGoals(Array.isArray(g.data) ? g.data : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openDetail = async (goal: SavingsGoal) => {
    setDetailGoal(goal);
    try {
      const res = await api.get(`/api/savings/goals/${goal.id}/deposits`);
      setDeposits(Array.isArray(res.data) ? res.data : []);
    } catch { setDeposits([]); }
  };

  const createGoal = async () => {
    try {
      await api.post('/api/savings/goals', {
        name: form.name, icon: form.icon, color: form.color,
        targetAmount: parseFloat(form.targetAmount), monthlyContribution: parseFloat(form.monthlyContribution || '0'),
        priority: form.priority, targetDate: form.targetDate || null,
      });
      toast({ title: 'Goal created!' });
      setOpen(false);
      setForm({ name: '', icon: '🎯', color: '#8B5CF6', targetAmount: '', monthlyContribution: '', priority: 'Medium', targetDate: '' });
      fetchData();
    } catch { toast({ title: 'Failed to create goal', variant: 'destructive' }); }
  };

  const makeDeposit = async () => {
    if (!detailGoal || !depositAmount) return;
    try {
      const res = await api.post(`/api/savings/goals/${detailGoal.id}/deposit`, { amount: parseFloat(depositAmount), note: depositNote });
      toast({ title: `Deposit made! ${res.data?.pointsEarned ? `+${res.data.pointsEarned} pts` : ''}` });
      setDepositAmount('');
      setDepositNote('');
      openDetail(detailGoal);
      fetchData();
    } catch { toast({ title: 'Deposit failed', variant: 'destructive' }); }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/api/savings/goals/${id}`);
      toast({ title: 'Goal deleted' });
      setDetailGoal(null);
      fetchData();
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  if (loading) return <div className="space-y-6"><ModuleNav items={savingsNav} /><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div></div>;

  const summaryCards = [
    { label: 'Total Saved', value: formatZAR(summary?.totalSaved ?? 0), cls: 'text-success' },
    { label: 'Total Targets', value: formatZAR(summary?.totalTargets ?? 0), cls: 'text-foreground' },
    { label: 'Overall Progress', value: `${(summary?.overallProgress ?? 0).toFixed(0)}%`, cls: 'text-primary' },
    { label: 'Active Goals', value: `${summary?.activeGoals ?? 0}`, cls: 'text-foreground' },
  ];

  // Detail view
  if (detailGoal) {
    return (
      <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
        <ModuleNav items={savingsNav} />
        <motion.div variants={itemV}>
          <Button variant="ghost" size="sm" onClick={() => setDetailGoal(null)} className="mb-4">← Back to Goals</Button>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{detailGoal.icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{detailGoal.name}</h2>
                <Badge className={priorityColors[detailGoal.priority] || ''}>{detailGoal.priority}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto text-destructive" onClick={() => deleteGoal(detailGoal.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Progress value={detailGoal.progressPercentage} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">{formatZAR(detailGoal.currentAmount)} / {formatZAR(detailGoal.targetAmount)} ({detailGoal.progressPercentage.toFixed(0)}%)</p>

            <div className="mt-6 p-4 rounded-lg bg-secondary/30 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Make a Deposit</h3>
              <div className="flex gap-2">
                <Input type="number" placeholder="Amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="flex-1" />
                <Input placeholder="Note (optional)" value={depositNote} onChange={(e) => setDepositNote(e.target.value)} className="flex-1" />
                <Button onClick={makeDeposit} disabled={!depositAmount}>Deposit</Button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Deposit History</h3>
              {deposits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deposits yet. Make your first one! 💰</p>
              ) : (
                <div className="space-y-1">
                  {deposits.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/30">
                      <div>
                        <span className="text-sm font-mono text-success">+{formatZAR(d.amount)}</span>
                        {d.note && <span className="text-xs text-muted-foreground ml-2">{d.note}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(d.createdAt || d.date).toLocaleDateString('en-ZA')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
      <ModuleNav items={savingsNav} />
      <motion.h1 variants={itemV} className="text-2xl font-semibold tracking-tight text-foreground">Savings Goals</motion.h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <motion.div key={c.label} variants={itemV} className="rounded-xl border border-border bg-card p-5">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <p className={`text-xl font-semibold font-mono mt-1 ${c.cls}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Your Goals</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create Goal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Savings Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Emergency Fund" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
                <div><Label>Color</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Target Amount (R)</Label><Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></div>
                <div><Label>Monthly Contribution (R)</Label><Input type="number" value={form.monthlyContribution} onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Target Date</Label><Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={createGoal} disabled={!form.name || !form.targetAmount}>Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-12 text-center">
          <PiggyBank className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No savings goals yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first savings goal to get started! 🎯</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => (
            <motion.div key={g.id} variants={itemV} onClick={() => openDetail(g)}
              className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{g.name}</h3>
                  <Badge className={`text-[10px] ${priorityColors[g.priority] || ''}`}>{g.priority}</Badge>
                </div>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: g.color }}
                  initial={{ width: 0 }} animate={{ width: `${Math.min(g.progressPercentage, 100)}%` }}
                  transition={{ duration: 0.8 }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-mono text-foreground">{formatZAR(g.currentAmount)}</span>
                <span className="text-muted-foreground">{formatZAR(g.targetAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{g.progressPercentage.toFixed(0)}% complete</p>
              {g.estimatedMonthsToGoal && <p className="text-[10px] text-muted-foreground">~{g.estimatedMonthsToGoal} months to go</p>}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Savings;
