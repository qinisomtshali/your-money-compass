import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleNav } from '@/components/ModuleNav';
import { Search, ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
}

interface PricePoint {
  date: string;
  close: number;
}

const NAV = [
  { to: '/stocks', label: 'Search & Quote' },
  { to: '/stocks/watchlist', label: 'Watchlist' },
];

const Stocks = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [days, setDays] = useState('30');

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/api/stocks/search?query=${encodeURIComponent(query)}`);
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch { toast.error('Search failed'); }
    setSearching(false);
  };

  const fetchQuote = async (symbol: string) => {
    setLoadingQuote(true);
    setQuote(null);
    try {
      const { data } = await api.get(`/api/stocks/quote/${symbol}`);
      setQuote(data);
      fetchHistory(symbol, Number(days));
    } catch { toast.error('Failed to load quote'); }
    setLoadingQuote(false);
  };

  const fetchHistory = async (symbol: string, d: number) => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/api/stocks/history/${symbol}?days=${d}`);
      setHistory(Array.isArray(data) ? data : data.prices || []);
    } catch { setHistory([]); }
    setLoadingHistory(false);
  };

  const handleDaysChange = (val: string) => {
    setDays(val);
    if (quote) fetchHistory(quote.symbol, Number(val));
  };

  const positive = quote && quote.change >= 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Stock Market</h1>
      <p className="text-muted-foreground text-sm mb-6">Search stocks and track prices</p>
      <ModuleNav items={NAV} />

      {!quote ? (
        <>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Search stocks (e.g. AAPL, MSFT)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              className="max-w-md"
            />
            <Button onClick={search} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {searching && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}

          {!searching && results.length === 0 && query && (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No results found. Try a different search term.</p>
            </div>
          )}

          {!searching && results.length === 0 && !query && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Search for a stock symbol or company name to get started.</p>
            </div>
          )}

          <div className="space-y-2">
            {results.map((r) => (
              <Card
                key={r.symbol}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fetchQuote(r.symbol)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">{r.symbol}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{r.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{r.type}</Badge>
                    <Badge variant="secondary">{r.region}</Badge>
                    <Badge variant="secondary">{r.currency}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setQuote(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to search
          </Button>

          {loadingQuote ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-3xl font-bold">{quote.symbol}</h2>
                      <p className="text-4xl font-bold mt-2">{formatZAR(quote.price)}</p>
                      <div className={`flex items-center gap-2 mt-2 ${positive ? 'text-green-500' : 'text-red-500'}`}>
                        {positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        <span className="text-lg font-semibold">
                          {positive ? '+' : ''}{quote.change?.toFixed(2)} ({positive ? '+' : ''}{quote.changePercent?.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div><span className="text-muted-foreground">Open:</span> <span className="font-medium">{formatZAR(quote.open)}</span></div>
                      <div><span className="text-muted-foreground">High:</span> <span className="font-medium">{formatZAR(quote.high)}</span></div>
                      <div><span className="text-muted-foreground">Low:</span> <span className="font-medium">{formatZAR(quote.low)}</span></div>
                      <div><span className="text-muted-foreground">Prev Close:</span> <span className="font-medium">{formatZAR(quote.previousClose)}</span></div>
                      <div><span className="text-muted-foreground">Volume:</span> <span className="font-medium">{quote.volume?.toLocaleString()}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-lg">Price History</CardTitle>
                  <Select value={days} onValueChange={handleDaysChange}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <Skeleton className="h-64 w-full" />
                  ) : history.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">No price history available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Stocks;
