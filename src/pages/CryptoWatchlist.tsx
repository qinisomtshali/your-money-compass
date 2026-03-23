import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ModuleNav } from '@/components/ModuleNav';
import { Plus, Trash2, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface CryptoWatchItem {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  holdingQuantity: number;
  averageBuyPrice: number;
  currency: string;
  currentValue?: number;
  profitLoss?: number;
  alertPriceAbove?: number;
  alertPriceBelow?: number;
  notes?: string;
}

const NAV = [
  { to: '/crypto', label: 'Market' },
  { to: '/crypto/watchlist', label: 'Watchlist' },
];

const CryptoWatchlist = () => {
  const [items, setItems] = useState<CryptoWatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    coinId: '', symbol: '', name: '', holdingQuantity: '', averageBuyPrice: '',
    currency: 'ZAR', alertPriceAbove: '', alertPriceBelow: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/crypto/watchlist');
      setItems(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load watchlist'); }
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, []);

  const add = async () => {
    if (!form.coinId || !form.symbol) { toast.error('Coin ID and symbol required'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/crypto/watchlist', {
        coinId: form.coinId, symbol: form.symbol, name: form.name,
        holdingQuantity: Number(form.holdingQuantity) || 0,
        averageBuyPrice: Number(form.averageBuyPrice) || 0,
        currency: form.currency,
        alertPriceAbove: form.alertPriceAbove ? Number(form.alertPriceAbove) : null,
        alertPriceBelow: form.alertPriceBelow ? Number(form.alertPriceBelow) : null,
        notes: form.notes,
      });
      toast.success('Added to watchlist');
      setOpen(false);
      setForm({ coinId: '', symbol: '', name: '', holdingQuantity: '', averageBuyPrice: '', currency: 'ZAR', alertPriceAbove: '', alertPriceBelow: '', notes: '' });
      fetchList();
    } catch { toast.error('Failed to add'); }
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/crypto/watchlist/${id}`);
      toast.success('Removed');
      fetchList();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Crypto Market</h1>
      <p className="text-muted-foreground text-sm mb-6">Track cryptocurrency prices and trends</p>
      <ModuleNav items={NAV} />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Your Crypto Watchlist</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Coin</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add to Watchlist</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Coin ID *</Label><Input value={form.coinId} onChange={(e) => setForm({ ...form, coinId: e.target.value })} placeholder="bitcoin" /></div>
              <div><Label>Symbol *</Label><Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="BTC" /></div>
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bitcoin" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Holding Qty</Label><Input type="number" value={form.holdingQuantity} onChange={(e) => setForm({ ...form, holdingQuantity: e.target.value })} /></div>
                <div><Label>Avg Buy Price</Label><Input type="number" value={form.averageBuyPrice} onChange={(e) => setForm({ ...form, averageBuyPrice: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Alert Above</Label><Input type="number" value={form.alertPriceAbove} onChange={(e) => setForm({ ...form, alertPriceAbove: e.target.value })} /></div>
                <div><Label>Alert Below</Label><Input type="number" value={form.alertPriceBelow} onChange={(e) => setForm({ ...form, alertPriceBelow: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={add} disabled={submitting} className="w-full">{submitting ? 'Adding...' : 'Add to Watchlist'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Your crypto watchlist is empty.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const pl = item.profitLoss ?? (item.currentValue ? item.currentValue - item.holdingQuantity * item.averageBuyPrice : null);
            return (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{item.name || item.coinId}</p>
                      <p className="text-sm text-muted-foreground uppercase">{item.symbol}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Holding:</span> {item.holdingQuantity}</p>
                    <p><span className="text-muted-foreground">Avg Buy:</span> {formatZAR(item.averageBuyPrice)}</p>
                    {item.currentValue != null && <p><span className="text-muted-foreground">Value:</span> {formatZAR(item.currentValue)}</p>}
                    {pl != null && (
                      <p className={`flex items-center gap-1 font-semibold ${pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        P&L: {formatZAR(pl)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CryptoWatchlist;
