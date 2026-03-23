import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModuleNav } from '@/components/ModuleNav';
import { RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const NAV = [
  { to: '/currency', label: 'Convert' },
  { to: '/currency/bulk', label: 'Bulk Convert' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'JPY', 'AUD', 'CAD', 'CHF', 'INR', 'BRL', 'CNY'];

interface BulkResult {
  currency: string;
  convertedAmount: number;
  rate: number;
}

const CurrencyBulk = () => {
  const [fromCurrency, setFromCurrency] = useState('ZAR');
  const [amount, setAmount] = useState('10000');
  const [selected, setSelected] = useState<string[]>(['USD', 'EUR', 'GBP']);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [converting, setConverting] = useState(false);

  const toggleCurrency = (code: string) => {
    setSelected((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  };

  const convert = async () => {
    if (!amount || selected.length === 0) { toast.error('Enter amount and select currencies'); return; }
    setConverting(true);
    try {
      const { data } = await api.post('/api/currency/bulk-convert', {
        fromCurrency,
        amount: Number(amount),
        targetCurrencies: selected,
      });
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch { toast.error('Bulk conversion failed'); }
    setConverting(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Currency Converter</h1>
      <p className="text-muted-foreground text-sm mb-6">Convert between currencies with live rates</p>
      <ModuleNav items={NAV} />

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <Label>From Currency</Label>
              <Input value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value.toUpperCase())} placeholder="ZAR" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" />
            </div>
          </div>

          <Label className="mb-2 block">Target Currencies</Label>
          <div className="flex flex-wrap gap-3 mb-4">
            {CURRENCIES.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={selected.includes(c)} onCheckedChange={() => toggleCurrency(c)} />
                {c}
              </label>
            ))}
          </div>

          <Button onClick={convert} disabled={converting}>
            {converting && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
            Convert to {selected.length} currencies
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Results</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Converted Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.currency}>
                      <TableCell className="font-medium">{r.currency}</TableCell>
                      <TableCell className="text-right">{r.rate?.toFixed(6)}</TableCell>
                      <TableCell className="text-right font-semibold">{r.convertedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurrencyBulk;
