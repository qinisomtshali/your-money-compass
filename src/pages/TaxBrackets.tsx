import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ModuleNav } from '@/components/ModuleNav';
import { RefreshCw } from 'lucide-react';
import { formatZAR } from '@/lib/api';
import axios from 'axios';

interface TaxBracket {
  range: string;
  rate: number;
}

interface BracketsData {
  taxYear?: string;
  brackets: TaxBracket[];
  rebates?: { primary?: number; secondary?: number; tertiary?: number };
  thresholds?: { below65?: number; age65to74?: number; age75AndOver?: number };
  vatRate?: number;
  retirementDeductionLimit?: { percentage?: number; maxAmount?: number };
}

const NAV = [
  { to: '/tax', label: 'Calculator' },
  { to: '/tax/compare', label: 'Compare' },
  { to: '/tax/brackets', label: 'Brackets' },
];

const TaxBrackets = () => {
  const [data, setData] = useState<BracketsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetch = async () => {
    setLoading(true);
    setError(false);
    try {
      // Public endpoint — no auth needed
      const res = await axios.get(`${baseUrl}/api/tax/brackets`);
      setData(res.data);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">SA Tax Calculator</h1>
        <p className="text-muted-foreground text-sm mb-6">Calculate your South African income tax</p>
        <ModuleNav items={NAV} />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">SA Tax Calculator</h1>
        <p className="text-muted-foreground text-sm mb-6">Calculate your South African income tax</p>
        <ModuleNav items={NAV} />
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Failed to load tax brackets.</p>
          <Button onClick={fetch}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">SA Tax Calculator</h1>
      <p className="text-muted-foreground text-sm mb-6">Calculate your South African income tax</p>
      <ModuleNav items={NAV} />

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold">Tax Brackets Reference</h2>
        {data.taxYear && <Badge variant="secondary">{data.taxYear}</Badge>}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Income Tax Brackets</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taxable Income Range</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.brackets.map((b, i) => (
                  <TableRow key={i}>
                    <TableCell>{b.range}</TableCell>
                    <TableCell className="text-right font-semibold">{b.rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {data.rebates && (
          <Card>
            <CardHeader><CardTitle className="text-base">Rebates</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.rebates.primary != null && <p><span className="text-muted-foreground">Primary:</span> <span className="font-medium">{formatZAR(data.rebates.primary)}</span></p>}
              {data.rebates.secondary != null && <p><span className="text-muted-foreground">Secondary (65+):</span> <span className="font-medium">{formatZAR(data.rebates.secondary)}</span></p>}
              {data.rebates.tertiary != null && <p><span className="text-muted-foreground">Tertiary (75+):</span> <span className="font-medium">{formatZAR(data.rebates.tertiary)}</span></p>}
            </CardContent>
          </Card>
        )}

        {data.thresholds && (
          <Card>
            <CardHeader><CardTitle className="text-base">Tax Thresholds</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.thresholds.below65 != null && <p><span className="text-muted-foreground">Below 65:</span> <span className="font-medium">{formatZAR(data.thresholds.below65)}</span></p>}
              {data.thresholds.age65to74 != null && <p><span className="text-muted-foreground">Age 65–74:</span> <span className="font-medium">{formatZAR(data.thresholds.age65to74)}</span></p>}
              {data.thresholds.age75AndOver != null && <p><span className="text-muted-foreground">Age 75+:</span> <span className="font-medium">{formatZAR(data.thresholds.age75AndOver)}</span></p>}
            </CardContent>
          </Card>
        )}

        {(data.vatRate != null || data.retirementDeductionLimit) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Other</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.vatRate != null && <p><span className="text-muted-foreground">VAT Rate:</span> <span className="font-medium">{data.vatRate}%</span></p>}
              {data.retirementDeductionLimit?.percentage != null && <p><span className="text-muted-foreground">Retirement Deduction:</span> <span className="font-medium">{data.retirementDeductionLimit.percentage}% of remuneration</span></p>}
              {data.retirementDeductionLimit?.maxAmount != null && <p><span className="text-muted-foreground">Max Deduction:</span> <span className="font-medium">{formatZAR(data.retirementDeductionLimit.maxAmount)}</span></p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TaxBrackets;
