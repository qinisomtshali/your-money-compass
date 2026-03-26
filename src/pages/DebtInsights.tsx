import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { ModuleNav } from '@/components/ModuleNav';
import { motion } from 'framer-motion';
import { Lightbulb, Shield, Scale, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const debtNav = [
  { to: '/debts', label: 'Dashboard' },
  { to: '/debts/payoff', label: 'Payoff Calculator' },
  { to: '/debts/insights', label: 'Insights' },
];

interface Insight {
  debtType: string;
  typicalRate: string;
  averageRate: number;
  tip: string;
}

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const DebtInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/debts/insights');
        setInsights(res.data);
      } catch {
        setError('Failed to load insights');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div>
      <ModuleNav items={debtNav} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  if (error) return (
    <div>
      <ModuleNav items={debtNav} />
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">SA Debt Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">South African debt landscape and practical tips</p>
      </div>

      <ModuleNav items={debtNav} />

      <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <motion.div
              key={insight.debtType}
              variants={itemV}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">{insight.debtType}</h3>
                </div>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                  {insight.typicalRate}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{insight.tip}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Average rate: </span>
                <span className="text-xs font-medium">{insight.averageRate}%</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* NCR / NCA Info */}
        <motion.div variants={itemV} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold">NCR Debt Counselling</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you're struggling with debt, the National Credit Regulator (NCR) can help. 
              Debt counselling restructures your payments into one affordable amount and protects 
              your assets from repossession.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">NCR Helpline:</span>
              <span className="font-medium">0860 627 627</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold">Your NCA Rights</h3>
            </div>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li>• Right to apply for credit without discrimination</li>
              <li>• Right to reasons if credit is refused</li>
              <li>• Right to information in plain language</li>
              <li>• Right to apply for debt review if over-indebted</li>
              <li>• Protection against reckless lending</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DebtInsights;
