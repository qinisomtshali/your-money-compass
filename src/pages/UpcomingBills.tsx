import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { formatZAR } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/Skeleton';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const frequencyColors: Record<string, string> = {
  Monthly: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Weekly: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BiWeekly: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Quarterly: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Yearly: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

interface UpcomingBill {
  recurringId: string;
  name: string;
  amount: number;
  type: string;
  categoryName: string;
  dueDate: string;
  daysUntilDue: number;
  frequency: string;
  isOverdue: boolean;
}

const SubNav = () => {
  const navigate = useNavigate();
  return (
    <Tabs value="upcoming" onValueChange={(v) => {
      const routes: Record<string, string> = { bills: '/recurring', calendar: '/recurring/calendar', upcoming: '/recurring/upcoming', payday: '/recurring/payday' };
      navigate(routes[v]);
    }}>
      <TabsList className="mb-6">
        <TabsTrigger value="bills">My Bills</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="payday">Payday Plan</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

const dueLabel = (days: number, isOverdue: boolean) => {
  if (isOverdue) return 'Overdue!';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
};

export default function UpcomingBills() {
  const [days, setDays] = useState('7');

  const { data, isLoading } = useQuery<UpcomingBill[]>({
    queryKey: ['recurring-upcoming', days],
    queryFn: () => api.get(`/api/recurring/upcoming?days=${days}`).then(r => r.data),
  });

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">Bills & Recurring</h1>
        <p className="text-muted-foreground text-sm mt-1">Upcoming bills and due dates</p>
      </div>

      <SubNav />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Bills</h2>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Next 7 days</SelectItem>
            <SelectItem value="14">Next 14 days</SelectItem>
            <SelectItem value="30">Next 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !data?.length ? (
        <Card><CardContent className="py-16 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No bills due soon</h3>
          <p className="text-muted-foreground text-sm">No bills due in the next {days} days — enjoy the calm!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.map(bill => (
            <Card key={bill.recurringId} className={cn(bill.isOverdue && "border-destructive/50")}>
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {bill.isOverdue ? <AlertTriangle className="h-5 w-5 text-destructive shrink-0" /> : <Clock className="h-5 w-5 text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{bill.name}</span>
                      <Badge variant="outline" className={frequencyColors[bill.frequency] || ''}>{bill.frequency}</Badge>
                      <Badge variant="secondary">{bill.categoryName}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-muted-foreground">{format(new Date(bill.dueDate), 'EEE, MMM d')}</span>
                      <span className={cn("font-medium", bill.isOverdue ? 'text-destructive' : bill.daysUntilDue <= 2 ? 'text-amber-400' : 'text-muted-foreground')}>
                        {dueLabel(bill.daysUntilDue, bill.isOverdue)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={cn("text-lg font-bold shrink-0", bill.type === 'Income' ? 'text-green-400' : 'text-destructive')}>
                  {bill.type === 'Income' ? '+' : '-'}{formatZAR(bill.amount)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
