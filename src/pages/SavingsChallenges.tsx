import { useEffect, useState } from 'react';
import api, { formatZAR } from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { ModuleNav } from '@/components/ModuleNav';
import { motion } from 'framer-motion';
import { Trophy, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  name: string;
  type: string;
  currentAmount: number;
  targetAmount: number;
  currentDay: number;
  totalDays: number;
  progressPercentage: number;
  status: string;
}

const savingsNav = [
  { to: '/savings', label: 'Goals' },
  { to: '/savings/challenges', label: 'Challenges' },
  { to: '/savings/calculator', label: 'Calculator' },
];

const typeBadge: Record<string, string> = {
  '30-day': 'bg-blue-500/20 text-blue-400',
  '52-week': 'bg-purple-500/20 text-purple-400',
  'no-spend': 'bg-orange-500/20 text-orange-400',
};

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const SavingsChallenges = () => {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [logOpen, setLogOpen] = useState<string | null>(null);
  const [type, setType] = useState('30-day');
  const [amount, setAmount] = useState('');

  const fetch = () => {
    setLoading(true);
    api.get('/api/savings/challenges').then((r) => setChallenges(Array.isArray(r.data) ? r.data : []))
      .catch(() => setChallenges([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const startChallenge = async () => {
    try {
      await api.post('/api/savings/challenges', { type });
      toast({ title: 'Challenge started! 🏆' });
      setCreateOpen(false);
      fetch();
    } catch { toast({ title: 'Failed to start challenge', variant: 'destructive' }); }
  };

  const logProgress = async (id: string) => {
    try {
      await api.post(`/api/savings/challenges/${id}/progress`, { amount: parseFloat(amount) });
      toast({ title: 'Progress logged!' });
      setLogOpen(null);
      setAmount('');
      fetch();
    } catch { toast({ title: 'Failed to log progress', variant: 'destructive' }); }
  };

  if (loading) return <div className="space-y-6"><ModuleNav items={savingsNav} /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div></div>;

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
      <ModuleNav items={savingsNav} />
      <div className="flex items-center justify-between">
        <motion.h1 variants={itemV} className="text-2xl font-semibold tracking-tight text-foreground">Savings Challenges</motion.h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Start Challenge</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start a Challenge</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Challenge Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30-day">30-Day Challenge</SelectItem>
                    <SelectItem value="52-week">52-Week Challenge</SelectItem>
                    <SelectItem value="no-spend">No-Spend Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={startChallenge}>Start Challenge</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {challenges.length === 0 ? (
        <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-12 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No active challenges.</p>
          <p className="text-sm text-muted-foreground mt-1">Start a savings challenge to build discipline! 💪</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <motion.div key={c.id} variants={itemV} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">{c.name}</h3>
                <Badge className={typeBadge[c.type] || 'bg-muted text-muted-foreground'}>{c.type}</Badge>
              </div>
              <Progress value={c.progressPercentage} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground mb-3">
                <span className="font-mono">{formatZAR(c.currentAmount)} / {formatZAR(c.targetAmount)}</span>
                <span>Day {c.currentDay} / {c.totalDays}</span>
              </div>
              <Dialog open={logOpen === c.id} onOpenChange={(o) => { setLogOpen(o ? c.id : null); setAmount(''); }}>
                <DialogTrigger asChild><Button size="sm" variant="outline" className="w-full">Log Progress</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Log Progress — {c.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div><Label>Amount (R)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                    <Button className="w-full" onClick={() => logProgress(c.id)} disabled={!amount}>Log</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SavingsChallenges;
