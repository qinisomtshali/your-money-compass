import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  currentPrice: number;
  priceChangePercentage24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply?: number;
}

interface ChartPoint {
  date: string;
  price: number;
}

const CryptoDetail = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const [coin, setCoin] = useState<CoinPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [days, setDays] = useState('30');
  const [currency] = useState('zar');

  useEffect(() => {
    if (!coinId) return;
    const fetchCoin = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/crypto/price/${coinId}?vsCurrency=${currency}`);
        setCoin(data);
      } catch { toast.error('Failed to load coin data'); }
      setLoading(false);
    };
    fetchCoin();
  }, [coinId, currency]);

  useEffect(() => {
    if (!coinId) return;
    const fetchChart = async () => {
      setLoadingChart(true);
      try {
        const { data } = await api.get(`/api/crypto/chart/${coinId}?vsCurrency=${currency}&days=${days}`);
        setChart(Array.isArray(data) ? data : data.prices || []);
      } catch { setChart([]); }
      setLoadingChart(false);
    };
    fetchChart();
  }, [coinId, days, currency]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-40 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Coin not found.</p>
        <Button onClick={() => navigate('/crypto')}>Back to Market</Button>
      </div>
    );
  }

  const positive = coin.priceChangePercentage24h >= 0;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/crypto')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Market
      </Button>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            {coin.image && <img src={coin.image} alt={coin.name} className="h-12 w-12 rounded-full" />}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{coin.name} <span className="text-muted-foreground uppercase text-lg">{coin.symbol}</span></h2>
              <p className="text-4xl font-bold mt-2">{formatZAR(coin.currentPrice)}</p>
              <div className={`flex items-center gap-2 mt-2 ${positive ? 'text-green-500' : 'text-red-500'}`}>
                {positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-lg font-semibold">{positive ? '+' : ''}{coin.priceChangePercentage24h?.toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div><p className="text-xs text-muted-foreground">24h High</p><p className="font-semibold">{formatZAR(coin.high24h)}</p></div>
            <div><p className="text-xs text-muted-foreground">24h Low</p><p className="font-semibold">{formatZAR(coin.low24h)}</p></div>
            <div><p className="text-xs text-muted-foreground">Market Cap</p><p className="font-semibold">R{(coin.marketCap / 1e9).toFixed(2)}B</p></div>
            <div><p className="text-xs text-muted-foreground">Circulating Supply</p><p className="font-semibold">{coin.circulatingSupply?.toLocaleString()}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Price History</CardTitle>
          <Select value={days} onValueChange={setDays}>
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
          {loadingChart ? (
            <Skeleton className="h-64 w-full" />
          ) : chart.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No chart data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoDetail;
