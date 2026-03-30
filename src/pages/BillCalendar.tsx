import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { formatZAR } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/Skeleton';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarBill {
  recurringId: string;
  name: string;
  amount: number;
  type: string;
  categoryName: string;
}

interface CalendarDay {
  day: number;
  date: string;
  isToday: boolean;
  isSalaryDay: boolean;
  bills: CalendarBill[];
}

interface CalendarData {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  days: CalendarDay[];
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SubNav = () => {
  const navigate = useNavigate();
  return (
    <Tabs value="calendar" onValueChange={(v) => {
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

export default function BillCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery<CalendarData>({
    queryKey: ['recurring-calendar', month, year],
    queryFn: () => api.get(`/api/recurring/calendar?month=${month}&year=${year}`).then(r => r.data),
  });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday-start
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = new Map<number, CalendarDay>();
  data?.days?.forEach(d => dayMap.set(d.day, d));

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">Bills & Recurring</h1>
        <p className="text-muted-foreground text-sm mt-1">Monthly bill calendar view</p>
      </div>

      <SubNav />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Income</p><p className="text-xl font-bold text-green-400">{formatZAR(data?.totalIncome || 0)}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-xl font-bold text-destructive">{formatZAR(data?.totalExpenses || 0)}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Net</p><p className={cn("text-xl font-bold", (data?.netAmount || 0) >= 0 ? 'text-green-400' : 'text-destructive')}>{formatZAR(data?.netAmount || 0)}</p></CardContent></Card>
          </>
        )}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
        <h2 className="text-lg font-semibold text-foreground">{MONTHS[month - 1]} {year}</h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      {isLoading ? <Skeleton className="h-96" /> : (
        <>
          {/* Desktop grid */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {WEEKDAYS.map(d => (
                <div key={d} className="bg-card px-2 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-card min-h-[100px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayData = dayMap.get(dayNum);
                const hasBills = dayData && dayData.bills.length > 0;
                return (
                  <div key={dayNum} className={cn("bg-card min-h-[100px] p-2 relative", dayData?.isToday && "ring-1 ring-primary", dayData?.isSalaryDay && "bg-green-500/5")}>
                    <span className={cn("text-xs font-medium", dayData?.isToday ? 'text-primary' : 'text-muted-foreground')}>{dayNum}</span>
                    {dayData?.isSalaryDay && <Badge className="absolute top-1 right-1 text-[9px] bg-green-500/20 text-green-400 border-green-500/30" variant="outline">💰</Badge>}
                    {hasBills && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="mt-1 space-y-0.5 cursor-pointer">
                            {dayData.bills.slice(0, 3).map((bill, bi) => (
                              <div key={bi} className="flex items-center gap-1 text-[10px] leading-tight">
                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", bill.type === 'Income' ? 'bg-green-400' : 'bg-destructive')} />
                                <span className="truncate text-foreground">{bill.name}</span>
                              </div>
                            ))}
                            {dayData.bills.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayData.bills.length - 3} more</span>}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">{MONTHS[month - 1]} {dayNum}</p>
                          <div className="space-y-2">
                            {dayData.bills.map((bill, bi) => (
                              <div key={bi} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={cn("w-2 h-2 rounded-full", bill.type === 'Income' ? 'bg-green-400' : 'bg-destructive')} />
                                  <span className="text-sm text-foreground">{bill.name}</span>
                                </div>
                                <span className={cn("text-sm font-medium", bill.type === 'Income' ? 'text-green-400' : 'text-destructive')}>{formatZAR(bill.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile list view */}
          <div className="md:hidden space-y-2">
            {data?.days?.filter(d => d.bills.length > 0).map(day => (
              <Card key={day.day}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-sm font-semibold", day.isToday ? 'text-primary' : 'text-foreground')}>{MONTHS[month - 1]} {day.day}</span>
                    {day.isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                    {day.isSalaryDay && <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">💰 Payday</Badge>}
                  </div>
                  <div className="space-y-1.5">
                    {day.bills.map((bill, bi) => (
                      <div key={bi} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", bill.type === 'Income' ? 'bg-green-400' : 'bg-destructive')} />
                          <span className="text-sm text-foreground">{bill.name}</span>
                        </div>
                        <span className={cn("text-sm font-medium", bill.type === 'Income' ? 'text-green-400' : 'text-destructive')}>{formatZAR(bill.amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!data?.days?.some(d => d.bills.length > 0) && (
              <Card><CardContent className="py-12 text-center">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">No bills this month</p>
              </CardContent></Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
