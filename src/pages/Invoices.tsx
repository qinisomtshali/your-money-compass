import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  toName: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: string;
}

interface InvoiceSummary {
  totalInvoices: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
  totalOutstanding: number;
  totalPaid: number;
}

const statusColor: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Sent: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
  Paid: 'bg-green-500/15 text-green-500 border-green-500/20',
  Overdue: 'bg-red-500/15 text-red-500 border-red-500/20',
  Cancelled: 'bg-muted text-muted-foreground',
};

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status !== 'all') params.set('status', status);
      const { data } = await api.get(`/api/invoices?${params}`);
      setInvoices(data.items || (Array.isArray(data) ? data : []));
      setTotalPages(data.totalPages || 1);
    } catch { toast.error('Failed to load invoices'); }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/api/invoices/summary');
      setSummary(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { fetchInvoices(); }, [page, status]);

  return (
    <div>
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm">Create and manage invoices</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="h-4 w-4 mr-2" /> New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{summary.totalInvoices}</p><div className="flex gap-2 mt-1 text-xs"><span className="text-muted-foreground">D:{summary.draftCount}</span><span className="text-blue-500">S:{summary.sentCount}</span><span className="text-green-500">P:{summary.paidCount}</span><span className="text-red-500">O:{summary.overdueCount}</span></div></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className={`text-2xl font-bold ${summary.totalOutstanding > 0 ? 'text-red-500' : ''}`}>{formatZAR(summary.totalOutstanding)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Paid</p><p className="text-2xl font-bold text-green-500">{formatZAR(summary.totalPaid)}</p></CardContent></Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No invoices found. Create your first invoice.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.toName}</TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-semibold">{formatZAR(inv.total)}</TableCell>
                    <TableCell><Badge className={statusColor[inv.status] || ''} variant="outline">{inv.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Invoices;
