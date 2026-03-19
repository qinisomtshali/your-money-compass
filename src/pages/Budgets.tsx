import { useEffect, useState } from 'react';
import api, { formatZAR, type Budget, type Category } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TableSkeleton } from '@/components/Skeleton';
import { cn } from '@/lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] as const } },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Budgets = () => {
  const now = new Date();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState({ amount: '', month: '', year: '', categoryId: '' });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/budgets?month=${month}&year=${year}`);
      setBudgets(data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { api.get('/api/categories').then(r => setCategories(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchBudgets(); }, [month, year]);

  const openCreate = () => {
    setEditing(null);
    setForm({ amount: '', month: String(month), year: String(year), categoryId: categories[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setForm({ amount: String(b.amount), month: String(b.month), year: String(b.year), categoryId: b.categoryId });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { amount: Number(form.amount), month: Number(form.month), year: Number(form.year), categoryId: form.categoryId };
    try {
      if (editing) {
        await api.put(`/api/budgets/${editing.id}`, body);
        toast.success('Budget updated.');
      } else {
        await api.post('/api/budgets', body);
        toast.success('Budget created.');
      }
      setDialogOpen(false);
      fetchBudgets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try { await api.delete(`/api/budgets/${id}`); toast.success('Budget deleted.'); fetchBudgets(); } catch { toast.error('Failed to delete'); }
  };

  const getProgressColor = (spent: number, budget: number) => {
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    if (pct > 100) return 'bg-destructive';
    if (pct > 75) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Budgets</h1>
        <div className="flex items-center gap-3">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="h-9 w-28 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-20 bg-secondary/50 border-border text-sm" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Budget</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'New'} Budget</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (R)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required className="bg-secondary/50 border-border font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={form.month} onValueChange={(v) => setForm(f => ({ ...f, month: v }))}>
                      <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} className="bg-secondary/50 border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm(f => ({ ...f, categoryId: v }))}>
                    <SelectTrigger className="bg-secondary/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.filter(c => c.type === 0).map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} /> : budgets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No budgets set for {MONTHS[month - 1]} {year}.</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="space-y-3">
          {budgets.map((b) => {
            const pct = b.amount > 0 ? Math.min((b.spentAmount / b.amount) * 100, 100) : 0;
            return (
              <motion.div key={b.id} variants={itemVariants} className="rounded-xl border border-border bg-card p-5 group">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.categoryName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatZAR(b.spentAmount)} of {formatZAR(b.amount)} · {formatZAR(b.remainingAmount)} remaining
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-mono tabular-nums font-medium', b.spentAmount > b.amount ? 'text-destructive' : 'text-muted-foreground')}>
                      {((b.spentAmount / b.amount) * 100).toFixed(0)}%
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
                    className={cn('h-full rounded-full', getProgressColor(b.spentAmount, b.amount))}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Budgets;
