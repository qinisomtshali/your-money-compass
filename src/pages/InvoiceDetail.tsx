import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Send, Check, Copy, Trash2, Printer } from 'lucide-react';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  date: string;
  dueDate: string;
  fromName: string;
  fromEmail?: string;
  fromAddress?: string;
  fromVatNumber?: string;
  toName: string;
  toEmail?: string;
  toAddress?: string;
  toVatNumber?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; lineTotal?: number }>;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discountPercentage: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  reference?: string;
}

const statusColor: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Sent: 'bg-blue-500/15 text-blue-500',
  Paid: 'bg-green-500/15 text-green-500',
  Overdue: 'bg-red-500/15 text-red-500',
  Cancelled: 'bg-muted text-muted-foreground',
};

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/invoices/${id}`);
      setInvoice(data);
    } catch { toast.error('Failed to load invoice'); }
    setLoading(false);
  };

  useEffect(() => { if (id) fetchInvoice(); }, [id]);

  const updateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/api/invoices/${id}/status`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      fetchInvoice();
    } catch { toast.error('Failed to update status'); }
  };

  const duplicate = async () => {
    try {
      const { data } = await api.post(`/api/invoices/${id}/duplicate`);
      toast.success('Invoice duplicated');
      navigate(`/invoices/${data.id || data}`);
    } catch { toast.error('Failed to duplicate'); }
  };

  const del = async () => {
    try {
      await api.delete(`/api/invoices/${id}`);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Invoice not found.</p>
        <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
      </div>
    );
  }

  const items = invoice.lineItems || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2 flex-wrap">
          {invoice.status === 'Draft' && (
            <Button variant="outline" size="sm" onClick={() => updateStatus('Sent')}>
              <Send className="h-4 w-4 mr-1" /> Mark Sent
            </Button>
          )}
          {(invoice.status === 'Sent' || invoice.status === 'Overdue') && (
            <Button variant="outline" size="sm" onClick={() => updateStatus('Paid')}>
              <Check className="h-4 w-4 mr-1" /> Mark Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={duplicate}>
            <Copy className="h-4 w-4 mr-1" /> Duplicate
          </Button>
          {invoice.status === 'Draft' && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={del}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="max-w-3xl mx-auto print:shadow-none print:border-0">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
            <Badge className={statusColor[invoice.status] || ''} variant="outline">{invoice.status}</Badge>
          </div>

          <div className="flex justify-between text-sm">
            <p><span className="text-muted-foreground">Date:</span> {new Date(invoice.date).toLocaleDateString()}</p>
            <p><span className="text-muted-foreground">Due:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>

          <Separator />

          {/* From / To */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">FROM</p>
              <p className="font-semibold">{invoice.fromName}</p>
              {invoice.fromEmail && <p className="text-sm text-muted-foreground">{invoice.fromEmail}</p>}
              {invoice.fromAddress && <p className="text-sm text-muted-foreground">{invoice.fromAddress}</p>}
              {invoice.fromVatNumber && <p className="text-sm text-muted-foreground">VAT: {invoice.fromVatNumber}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">TO</p>
              <p className="font-semibold">{invoice.toName}</p>
              {invoice.toEmail && <p className="text-sm text-muted-foreground">{invoice.toEmail}</p>}
              {invoice.toAddress && <p className="text-sm text-muted-foreground">{invoice.toAddress}</p>}
              {invoice.toVatNumber && <p className="text-sm text-muted-foreground">VAT: {invoice.toVatNumber}</p>}
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>{it.description}</TableCell>
                    <TableCell className="text-right">{it.quantity}</TableCell>
                    <TableCell className="text-right">{formatZAR(it.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatZAR(it.lineTotal ?? it.quantity * it.unitPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="text-right space-y-1 text-sm">
            <p>Subtotal: {formatZAR(invoice.subtotal)}</p>
            {invoice.discountAmount > 0 && <p className="text-green-500">Discount ({invoice.discountPercentage}%): -{formatZAR(invoice.discountAmount)}</p>}
            <p>VAT ({invoice.vatRate}%): {formatZAR(invoice.vatAmount)}</p>
            <p className="text-2xl font-bold mt-2">Total: {formatZAR(invoice.total)}</p>
          </div>

          {/* Banking */}
          {invoice.bankName && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">BANKING DETAILS</p>
                <div className="grid gap-1 text-sm">
                  <p><span className="text-muted-foreground">Bank:</span> {invoice.bankName}</p>
                  {invoice.accountHolder && <p><span className="text-muted-foreground">Account Holder:</span> {invoice.accountHolder}</p>}
                  {invoice.accountNumber && <p><span className="text-muted-foreground">Account:</span> {invoice.accountNumber}</p>}
                  {invoice.branchCode && <p><span className="text-muted-foreground">Branch:</span> {invoice.branchCode}</p>}
                  {invoice.reference && <p><span className="text-muted-foreground">Reference:</span> {invoice.reference}</p>}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div><p className="text-xs text-muted-foreground mb-1">NOTES</p><p className="text-sm">{invoice.notes}</p></div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;
