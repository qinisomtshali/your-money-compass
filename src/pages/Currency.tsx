import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleNav } from '@/components/ModuleNav';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface SupportedCurrency {
  code: string;
  name: string;
}

interface ConvertResult {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
}

interface PopularRate {
  currency: string;
  rate: number;
}

const NAV = [
  { to: '/currency', label: 'Convert' },
  { to: '/currency/bulk', label: 'Bulk Convert' },
];

const POPULAR_TARGETS = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'JPY'];

const Currency = () => {
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [from, setFrom] = useState('ZAR');
  const [to, setTo] = useState('USD');
  const [amount, setAmount] = useState('1000');
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [converting, setConverting] = useState(false);
  const [popularRates, setPopularRates] = useState<PopularRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data } = await api.get('/api/currency/supported');
        const list = Array.isArray(data) ? data : [];
        setCurrencies(list.map((c: string | SupportedCurrency) =>
          typeof c === 'string' ? { code: c, name: c } : c
        ));
      } catch { setCurrencies(POPULAR_TARGETS.map((c) => ({ code: c, name: c }))); }
      setLoadingCurrencies(false);
    };
    fetchCurrencies();
    fetchPopularRates();
  }, []);

  const fetchPopularRates = async () => {
    setLoadingRates(true);
    try {
      const rates = await Promise.all(
        POPULAR_TARGETS.map(async (c) => {
          const { data } = await api.get(`/api/currency/rate?from=ZAR&to=${c}`);
          return { currency: c, rate: data.rate || data };
        })
      );
      setPopularRates(rates);
    } catch { /* ignore */ }
    setLoadingRates(false);
  };

  const convert = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setConverting(true);
    try {
      const { data } = await api.get(`/api/currency/convert?from=${from}&to=${to}&amount=${amount}`);
      setResult(data);
    } catch { toast.error('Conversion failed'); }
    setConverting(false);
  };

  const swap = () => { setFrom(to); setTo(from); setResult(null); };

  const currencyOptions = currencies.length > 0
    ? currencies
    : [...new Set(['ZAR', ...POPULAR_TARGETS])].map((c) => ({ code: c, name: c }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Currency Converter</h1>
      <p className="text-muted-foreground text-sm mb-6">Convert between currencies with live rates</p>
      <ModuleNav items={NAV} />

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-[1fr,auto,1fr] items-end">
            <div>
              <Label>From</Label>
              {loadingCurrencies ? <Skeleton className="h-10 w-full mt-1" /> : (
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={swap} className="self-end">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div>
              <Label>To</Label>
              {loadingCurrencies ? <Skeleton className="h-10 w-full mt-1" /> : (
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-3 items-end">
            <div className="flex-1">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
            </div>
            <Button onClick={convert} disabled={converting}>
              {converting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Convert
            </Button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{Number(result.amount).toLocaleString()} {result.fromCurrency} =</p>
              <p className="text-4xl font-bold mt-1">{Number(result.convertedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {result.toCurrency}</p>
              <p className="text-sm text-muted-foreground mt-2">Rate: 1 {result.fromCurrency} = {result.rate?.toFixed(6)} {result.toCurrency}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Rates */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Popular ZAR Rates</CardTitle></CardHeader>
        <CardContent>
          {loadingRates ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : popularRates.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Unable to load rates.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularRates.map((r) => (
                <div key={r.currency} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="font-medium">ZAR → {r.currency}</span>
                  <span className="font-semibold">{typeof r.rate === 'number' ? r.rate.toFixed(4) : r.rate}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Currency;
