import { useEffect, useState, useCallback } from 'react';
import api, { formatZAR, type Transaction, type Category, type PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from '@/components/Skeleton';

const Transactions = () => {
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', categoryId: '', type: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({ amount: '', description: '', date: '', type: '0', categoryId: '' });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      const { data } = await api.get(`/api/transactions?${params}`);
      setData(data);
    } catch { } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { api.get('/api/categories').then(r => setCategories(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openCreate = () => {
    setEditing(null);
    setForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0], type: '0', categoryId: categories[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setForm({ amount: String(tx.amount), description: tx.description, date: tx.date.split('T')[0], type: String(tx.type), categoryId: tx.categoryId });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { amount: Number(form.amount), description: form.description, date: form.date, type: Number(form.type), categoryId: form.categoryId };
    try {
      if (editing) {
        await api.put(`/api/transactions/${editing.id}`, body);
        toast.success('Transaction updated.');
      } else {
        await api.post('/api/transactions', body);
        toast.success('Transaction recorded.');
      }
      setDialogOpen(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try { await api.delete(`/api/transactions/${id}`); toast.success('Transaction deleted.'); fetchTransactions(); } catch { toast.error('Failed to delete'); }
  };

  const items = data?.items || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Transaction</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'New'} Transaction</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount (R)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required className="bg-secondary/50 border-border font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required className="bg-secondary/50 border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required className="bg-secondary/50 border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="0">Expense</SelectItem>
                      <SelectItem value="1">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm(f => ({ ...f, categoryId: v }))}>
                    <SelectTrigger className="bg-secondary/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Add'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end sticky top-14 md:top-0 z-10 bg-background/80 backdrop-blur py-3 -mt-3 rounded-lg">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" value={filters.startDate} onChange={(e) => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }} className="h-9 w-36 bg-secondary/50 border-border text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" value={filters.endDate} onChange={(e) => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }} className="h-9 w-36 bg-secondary/50 border-border text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={filters.categoryId} onValueChange={(v) => { setFilters(f => ({ ...f, categoryId: v === 'all' ? '' : v })); setPage(1); }}>
            <SelectTrigger className="h-9 w-40 bg-secondary/50 border-border text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? <TableSkeleton rows={10} /> : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No transactions found. A fresh start.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Date</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Description</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Category</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Type</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-medium">Amount</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{new Date(tx.date).toLocaleDateString('en-ZA')}</td>
                    <td className="p-3 text-foreground">{tx.description}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{tx.category?.name || tx.categoryName || '-'}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium ${tx.type === 1 ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 1 ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-mono tabular-nums font-medium ${tx.type === 1 ? 'text-success' : 'text-foreground'}`}>
                      {tx.type === 1 ? '+' : '-'}{formatZAR(tx.amount)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tx)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {data.pageNumber} of {data.totalPages} · {data.totalCount} total</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!data.hasPreviousPage} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!data.hasNextPage} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Transactions;
