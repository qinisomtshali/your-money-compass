import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModuleNav } from '@/components/ModuleNav';
import { Search, Coins } from 'lucide-react';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  currentPrice: number;
  priceChangePercentage24h: number;
  marketCap: number;
  totalVolume: number;
  marketCapRank: number;
}

interface CryptoSearchResult {
  id: string;
  name: string;
  symbol: string;
  marketCapRank?: number;
  thumb?: string;
}

const NAV = [
  { to: '/crypto', label: 'Market' },
  { to: '/crypto/watchlist', label: 'Watchlist' },
];

const Crypto = () => {
  const navigate = useNavigate();
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('zar');
  const [limit, setLimit] = useState('20');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CryptoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchCoins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/crypto/top?limit=${limit}&vsCurrency=${currency}`);
      setCoins(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load crypto data'); }
    setLoading(false);
  };

  useEffect(() => { fetchCoins(); }, [currency, limit]);

  const search = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/api/crypto/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(Array.isArray(data) ? data : data.coins || []);
    } catch { toast.error('Search failed'); }
    setSearching(false);
  };

  const fmtPrice = (n: number) => currency === 'zar' ? formatZAR(n) : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const fmtMcap = (n: number) => currency === 'zar' ? `R${(n / 1e9).toFixed(2)}B` : `$${(n / 1e9).toFixed(2)}B`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Crypto Market</h1>
      <p className="text-muted-foreground text-sm mb-6">Track cryptocurrency prices and trends</p>
      <ModuleNav items={NAV} />

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search coins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="max-w-sm"
        />
        <Button onClick={search} disabled={searching} variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {searchResults.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Search Results</p>
            {searchResults.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/crypto/${r.id}`)}
              >
                {r.thumb && <img src={r.thumb} alt={r.name} className="h-6 w-6 rounded-full" />}
                <span className="font-medium">{r.name}</span>
                <Badge variant="outline" className="uppercase">{r.symbol}</Badge>
                {r.marketCapRank && <span className="text-xs text-muted-foreground ml-auto">#{r.marketCapRank}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="zar">ZAR</SelectItem>
            <SelectItem value="usd">USD</SelectItem>
            <SelectItem value="eur">EUR</SelectItem>
            <SelectItem value="gbp">GBP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coins Table */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : coins.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No cryptocurrency data available.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Coin</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h %</TableHead>
                <TableHead className="text-right hidden md:table-cell">Market Cap</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coins.map((coin) => (
                <TableRow
                  key={coin.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/crypto/${coin.id}`)}
                >
                  <TableCell className="text-muted-foreground">{coin.marketCapRank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {coin.image && <img src={coin.image} alt={coin.name} className="h-6 w-6 rounded-full" />}
                      <span className="font-medium">{coin.name}</span>
                      <span className="text-muted-foreground text-xs uppercase">{coin.symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{fmtPrice(coin.currentPrice)}</TableCell>
                  <TableCell className={`text-right font-medium ${coin.priceChangePercentage24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {coin.priceChangePercentage24h >= 0 ? '+' : ''}{coin.priceChangePercentage24h?.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">{fmtMcap(coin.marketCap)}</TableCell>
                  <TableCell className="text-right hidden lg:table-cell">{fmtMcap(coin.totalVolume)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Crypto;
