import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import api, { formatZAR } from '@/lib/api';
import { toast } from 'sonner';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [from, setFrom] = useState({ name: '', email: '', address: '', vatNumber: '' });
  const [to, setTo] = useState({ name: '', email: '', address: '', vatNumber: '' });
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [settings, setSettings] = useState({ currency: 'ZAR', vatRate: '15', discount: '0', dueDate: '', notes: '' });
  const [banking, setBanking] = useState({ bankName: '', accountHolder: '', accountNumber: '', branchCode: '', reference: '' });

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, val: string) => {
    const next = [...items];
    if (field === 'description') next[i].description = val;
    else next[i][field] = Number(val) || 0;
    setItems(next);
  };

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const discountAmt = subtotal * (Number(settings.discount) / 100);
  const afterDiscount = subtotal - discountAmt;
  const vatAmt = afterDiscount * (Number(settings.vatRate) / 100);
  const total = afterDiscount + vatAmt;

  const submit = async () => {
    if (!to.name) { toast.error('Recipient name required'); return; }
    if (items.every((it) => !it.description)) { toast.error('Add at least one line item'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/invoices', {
        fromName: from.name, fromEmail: from.email, fromAddress: from.address, fromVatNumber: from.vatNumber,
        toName: to.name, toEmail: to.email, toAddress: to.address, toVatNumber: to.vatNumber,
        lineItems: items.filter((it) => it.description),
        currency: settings.currency, vatRate: Number(settings.vatRate), discountPercentage: Number(settings.discount),
        dueDate: settings.dueDate, notes: settings.notes,
        bankName: banking.bankName, accountHolder: banking.accountHolder,
        accountNumber: banking.accountNumber, branchCode: banking.branchCode, reference: banking.reference,
      });
      toast.success('Invoice created');
      navigate('/invoices');
    } catch { toast.error('Failed to create invoice'); }
    setSubmitting(false);
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/invoices')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* Form */}
        <div className="space-y-6">
          {/* From */}
          <Card>
            <CardHeader><CardTitle className="text-base">From (Your Details)</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div><Label>Name</Label><Input value={from.name} onChange={(e) => setFrom({ ...from, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={from.email} onChange={(e) => setFrom({ ...from, email: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input value={from.address} onChange={(e) => setFrom({ ...from, address: e.target.value })} /></div>
              <div><Label>VAT Number</Label><Input value={from.vatNumber} onChange={(e) => setFrom({ ...from, vatNumber: e.target.value })} /></div>
            </CardContent>
          </Card>

          {/* To */}
          <Card>
            <CardHeader><CardTitle className="text-base">To (Client Details)</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div><Label>Name *</Label><Input value={to.name} onChange={(e) => setTo({ ...to, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={to.email} onChange={(e) => setTo({ ...to, email: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input value={to.address} onChange={(e) => setTo({ ...to, address: e.target.value })} /></div>
              <div><Label>VAT Number</Label><Input value={to.vatNumber} onChange={(e) => setTo({ ...to, vatNumber: e.target.value })} /></div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid gap-2 grid-cols-[1fr,80px,100px,auto] items-end">
                  <div><Label className="text-xs">Description</Label><Input value={it.description} onChange={(e) => updateItem(i, 'description', e.target.value)} /></div>
                  <div><Label className="text-xs">Qty</Label><Input type="number" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} /></div>
                  <div><Label className="text-xs">Unit Price</Label><Input type="number" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} /></div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div><Label>Currency</Label><Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} /></div>
              <div><Label>VAT Rate (%)</Label><Input type="number" value={settings.vatRate} onChange={(e) => setSettings({ ...settings, vatRate: e.target.value })} /></div>
              <div><Label>Discount (%)</Label><Input type="number" value={settings.discount} onChange={(e) => setSettings({ ...settings, discount: e.target.value })} /></div>
              <div><Label>Due Date</Label><Input type="date" value={settings.dueDate} onChange={(e) => setSettings({ ...settings, dueDate: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={settings.notes} onChange={(e) => setSettings({ ...settings, notes: e.target.value })} /></div>
            </CardContent>
          </Card>

          {/* Banking */}
          <Card>
            <CardHeader><CardTitle className="text-base">Banking Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div><Label>Bank Name</Label><Input value={banking.bankName} onChange={(e) => setBanking({ ...banking, bankName: e.target.value })} /></div>
              <div><Label>Account Holder</Label><Input value={banking.accountHolder} onChange={(e) => setBanking({ ...banking, accountHolder: e.target.value })} /></div>
              <div><Label>Account Number</Label><Input value={banking.accountNumber} onChange={(e) => setBanking({ ...banking, accountNumber: e.target.value })} /></div>
              <div><Label>Branch Code</Label><Input value={banking.branchCode} onChange={(e) => setBanking({ ...banking, branchCode: e.target.value })} /></div>
              <div><Label>Reference</Label><Input value={banking.reference} onChange={(e) => setBanking({ ...banking, reference: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Button onClick={submit} disabled={submitting} size="lg" className="w-full">
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>

        {/* Live Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <Card className="bg-card">
              <CardContent className="p-6 text-sm space-y-4">
                <h3 className="text-lg font-bold text-center mb-4">INVOICE PREVIEW</h3>
                <Separator />
                {from.name && (
                  <div><p className="text-xs text-muted-foreground">From</p><p className="font-medium">{from.name}</p>{from.email && <p className="text-xs text-muted-foreground">{from.email}</p>}{from.address && <p className="text-xs text-muted-foreground">{from.address}</p>}</div>
                )}
                {to.name && (
                  <div><p className="text-xs text-muted-foreground">To</p><p className="font-medium">{to.name}</p>{to.email && <p className="text-xs text-muted-foreground">{to.email}</p>}{to.address && <p className="text-xs text-muted-foreground">{to.address}</p>}</div>
                )}
                <Separator />
                <div className="space-y-2">
                  {items.filter((it) => it.description).map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{it.description} × {it.quantity}</span>
                      <span className="font-medium">{formatZAR(it.quantity * it.unitPrice)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1 text-right">
                  <p>Subtotal: {formatZAR(subtotal)}</p>
                  {discountAmt > 0 && <p className="text-green-500">Discount: -{formatZAR(discountAmt)}</p>}
                  <p>VAT ({settings.vatRate}%): {formatZAR(vatAmt)}</p>
                  <p className="text-xl font-bold mt-2">Total: {formatZAR(total)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreate;
