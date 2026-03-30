import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api, { formatZAR, Category } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/Skeleton';
import { toast } from 'sonner';
import { Plus, Repeat, Trash2, Pencil, CalendarIcon, Zap, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  description: string;
  type: string;
  categoryId: string;
  categoryName: string;
  frequency: string;
  dayOfMonth: number | null;
  dayOfWeek: string | null;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  lastGeneratedDate: string | null;
  isActive: boolean;
  autoGenerate: boolean;
  notifyBeforeDue: boolean;
  notifyDaysBefore: number;
  createdAt: string;
}

const frequencyColors: Record<string, string> = {
  Monthly: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Weekly: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BiWeekly: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Quarterly: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Yearly: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const SubNav = () => {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const current = path === '/recurring' ? 'bills' : path === '/recurring/calendar' ? 'calendar' : path === '/recurring/upcoming' ? 'upcoming' : 'payday';

  return (
    <Tabs value={current} onValueChange={(v) => {
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

export { SubNav };

const defaultForm = {
  name: '', amount: '', description: '', type: 'Expense', categoryId: '', frequency: 'Monthly',
  dayOfMonth: '1', dayOfWeek: '', startDate: new Date(), endDate: undefined as Date | undefined,
  autoGenerate: true, notifyBeforeDue: true, notifyDaysBefore: '2',
};

export default function RecurringBills() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: recurring, isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ['recurring'],
    queryFn: () => api.get('/api/recurring').then(r => r.data),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => editingId ? api.patch(`/api/recurring/${editingId}`, body) : api.post('/api/recurring', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      toast.success(editingId ? 'Recurring transaction updated' : 'Recurring transaction created');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save recurring transaction'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/recurring/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      toast.success('Deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/recurring/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const resetForm = () => { setForm(defaultForm); setEditingId(null); };

  const openEdit = (item: RecurringTransaction) => {
    setEditingId(item.id);
    setForm({
      name: item.name, amount: String(item.amount), description: item.description || '',
      type: item.type, categoryId: item.categoryId, frequency: item.frequency,
      dayOfMonth: String(item.dayOfMonth || 1), dayOfWeek: item.dayOfWeek || '',
      startDate: new Date(item.startDate), endDate: item.endDate ? new Date(item.endDate) : undefined,
      autoGenerate: item.autoGenerate, notifyBeforeDue: item.notifyBeforeDue,
      notifyDaysBefore: String(item.notifyDaysBefore),
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.amount || !form.categoryId) { toast.error('Fill in required fields'); return; }
    const showDayOfMonth = ['Monthly', 'Quarterly', 'Yearly'].includes(form.frequency);
    createMutation.mutate({
      name: form.name, amount: parseFloat(form.amount), description: form.description,
      type: form.type, categoryId: form.categoryId, frequency: form.frequency,
      dayOfMonth: showDayOfMonth ? parseInt(form.dayOfMonth) : null,
      dayOfWeek: !showDayOfMonth ? form.dayOfWeek || null : null,
      startDate: format(form.startDate, 'yyyy-MM-dd'),
      endDate: form.endDate ? format(form.endDate, 'yyyy-MM-dd') : null,
      autoGenerate: form.autoGenerate, notifyBeforeDue: form.notifyBeforeDue,
      notifyDaysBefore: parseInt(form.notifyDaysBefore),
    });
  };

  const activeItems = recurring?.filter(r => r.isActive) || [];
  const totalExpenses = activeItems.filter(r => r.type === 'Expense').reduce((s, r) => s + r.amount, 0);
  const totalIncome = activeItems.filter(r => r.type === 'Income').reduce((s, r) => s + r.amount, 0);

  const showDayOfMonth = ['Monthly', 'Quarterly', 'Yearly'].includes(form.frequency);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bills & Recurring</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your recurring transactions and subscriptions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Recurring</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Recurring Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rent, Netflix, Salary" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (R) *</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Expense">Expense</SelectItem><SelectItem value="Income">Income</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Category *</Label>
                <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Monthly', 'Weekly', 'BiWeekly', 'Quarterly', 'Yearly'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {showDayOfMonth ? (
                <div><Label>Day of Month</Label><Input type="number" min={1} max={31} value={form.dayOfMonth} onChange={e => setForm({ ...form, dayOfMonth: e.target.value })} /></div>
              ) : (
                <div><Label>Day of Week</Label>
                  <Select value={form.dayOfWeek} onValueChange={v => setForm({ ...form, dayOfWeek: v })}>
                    <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Start Date</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !form.startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{form.startDate ? format(form.startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.startDate} onSelect={d => d && setForm({ ...form, startDate: d })} className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <div><Label>End Date (optional)</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !form.endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{form.endDate ? format(form.endDate, 'PPP') : 'No end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.endDate} onSelect={d => setForm({ ...form, endDate: d })} className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional note" /></div>
              <div className="flex items-center justify-between"><Label>Auto-generate transactions</Label><Switch checked={form.autoGenerate} onCheckedChange={v => setForm({ ...form, autoGenerate: v })} /></div>
              <div className="flex items-center justify-between"><Label>Notify before due</Label><Switch checked={form.notifyBeforeDue} onCheckedChange={v => setForm({ ...form, notifyBeforeDue: v })} /></div>
              {form.notifyBeforeDue && <div><Label>Days before to notify</Label><Input type="number" min={1} max={30} value={form.notifyDaysBefore} onChange={e => setForm({ ...form, notifyDaysBefore: e.target.value })} /></div>}
              <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SubNav />

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Active Items</p><p className="text-2xl font-bold text-foreground">{activeItems.length}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Monthly Expenses</p><p className="text-2xl font-bold text-destructive">{formatZAR(totalExpenses)}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Monthly Income</p><p className="text-2xl font-bold text-green-400">{formatZAR(totalIncome)}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Net Recurring</p><p className={cn("text-2xl font-bold", totalIncome - totalExpenses >= 0 ? 'text-green-400' : 'text-destructive')}>{formatZAR(totalIncome - totalExpenses)}</p></CardContent></Card>
          </>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : !recurring?.length ? (
        <Card><CardContent className="py-16 text-center">
          <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No recurring transactions yet</h3>
          <p className="text-muted-foreground text-sm">Add your first recurring transaction — rent, salary, subscriptions.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {recurring.map(item => (
            <Card key={item.id} className={cn("transition-opacity", !item.isActive && "opacity-50")}>
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <Badge variant="outline" className={frequencyColors[item.frequency] || ''}>{item.frequency}</Badge>
                    <Badge variant="secondary">{item.categoryName}</Badge>
                    {item.autoGenerate && <Badge variant="outline" className="text-xs"><Zap className="h-3 w-3 mr-1" />Auto</Badge>}
                    {item.notifyBeforeDue && <Badge variant="outline" className="text-xs"><Bell className="h-3 w-3 mr-1" />Notify</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {item.dayOfMonth && <span>Due on the {ordinal(item.dayOfMonth)}</span>}
                    {item.dayOfWeek && <span>Every {item.dayOfWeek}</span>}
                    <span>Next: {format(new Date(item.nextDueDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-lg font-bold", item.type === 'Income' ? 'text-green-400' : 'text-destructive')}>
                    {item.type === 'Income' ? '+' : '-'}{formatZAR(item.amount)}
                  </span>
                  <Switch checked={item.isActive} onCheckedChange={() => toggleMutation.mutate(item.id)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
