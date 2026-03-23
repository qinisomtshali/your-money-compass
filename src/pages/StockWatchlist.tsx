import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ModuleNav } from '@/components/ModuleNav';
import { Plus, Trash2, Eye } from 'lucide-react';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface WatchlistItem {
  id: string;
  symbol: string;
  exchange: string;
  name: string;
  alertPriceAbove?: number;
  alertPriceBelow?: number;
  notes?: string;
}

const NAV = [
  { to: '/stocks', label: 'Search & Quote' },
  { to: '/stocks/watchlist', label: 'Watchlist' },
];

const StockWatchlist = () => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ symbol: '', exchange: '', name: '', alertPriceAbove: '', alertPriceBelow: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/stocks/watchlist');
      setItems(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load watchlist'); }
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, []);

  const add = async () => {
    if (!form.symbol) { toast.error('Symbol is required'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/stocks/watchlist', {
        symbol: form.symbol,
        exchange: form.exchange,
        name: form.name,
        alertPriceAbove: form.alertPriceAbove ? Number(form.alertPriceAbove) : null,
        alertPriceBelow: form.alertPriceBelow ? Number(form.alertPriceBelow) : null,
        notes: form.notes,
      });
      toast.success('Added to watchlist');
      setOpen(false);
      setForm({ symbol: '', exchange: '', name: '', alertPriceAbove: '', alertPriceBelow: '', notes: '' });
      fetchList();
    } catch { toast.error('Failed to add'); }
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/stocks/watchlist/${id}`);
      toast.success('Removed');
      fetchList();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Stock Market</h1>
      <p className="text-muted-foreground text-sm mb-6">Search stocks and track prices</p>
      <ModuleNav items={NAV} />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Your Watchlist</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Stock</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to Watchlist</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Symbol *</Label><Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="AAPL" /></div>
              <div><Label>Exchange</Label><Input value={form.exchange} onChange={(e) => setForm({ ...form, exchange: e.target.value })} placeholder="NASDAQ" /></div>
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Apple Inc." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Alert Above (R)</Label><Input type="number" value={form.alertPriceAbove} onChange={(e) => setForm({ ...form, alertPriceAbove: e.target.value })} /></div>
                <div><Label>Alert Below (R)</Label><Input type="number" value={form.alertPriceBelow} onChange={(e) => setForm({ ...form, alertPriceBelow: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={add} disabled={submitting} className="w-full">{submitting ? 'Adding...' : 'Add to Watchlist'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Your watchlist is empty. Add stocks to track them.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{item.symbol}</p>
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    {item.exchange && <p className="text-xs text-muted-foreground mt-1">{item.exchange}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {item.alertPriceAbove && <p><span className="text-muted-foreground">Alert above:</span> {formatZAR(item.alertPriceAbove)}</p>}
                  {item.alertPriceBelow && <p><span className="text-muted-foreground">Alert below:</span> {formatZAR(item.alertPriceBelow)}</p>}
                  {item.notes && <p className="text-muted-foreground text-xs mt-2">{item.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockWatchlist;
