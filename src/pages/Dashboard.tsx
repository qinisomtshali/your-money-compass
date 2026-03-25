import { useEffect, useState } from 'react';
import api, { formatZAR } from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, PiggyBank, Percent, Flame, Lightbulb, Trophy, Target, Zap } from 'lucide-react';
import { Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface DashboardData {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  totalPoints: number;
  level: number;
  tier: string;
  currentStreak: number;
  healthScore: number;
  healthGrade: string;
  recentActivity: { type: string; description: string; amount: number | null; points: number; timestamp: string }[];
  dailyTip: { id: string; title: string; content: string; category: string; difficulty: string } | null;
  totalSavingsGoalProgress: number;
  activeSavingsGoals: number;
  budgetsOnTrack: number;
  totalBudgets: number;
}

interface HealthData {
  totalScore: number;
  maxScore: number;
  grade: string;
  categories: { name: string; score: number; maxScore: number; status: string; tip: string }[];
}

interface DashboardProfile {
  pointsToNextLevel: number;
  totalPoints: number;
  level: number;
  tier: string;
}

const tierColors: Record<string, string> = {
  Bronze: 'bg-amber-700/20 text-amber-400 border-amber-700/40',
  Silver: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  Gold: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
  Platinum: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
  Diamond: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
};

const gradeColor = (score: number) => {
  if (score >= 85) return 'hsl(152, 60%, 45%)';
  if (score >= 70) return 'hsl(152, 50%, 50%)';
  if (score >= 55) return 'hsl(48, 96%, 53%)';
  if (score >= 35) return 'hsl(25, 95%, 53%)';
  return 'hsl(0, 72%, 51%)';
};

const gradeText = (score: number) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Great';
  if (score >= 55) return 'Good';
  if (score >= 35) return 'Fair';
  return 'Needs Work';
};

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06, ease: [0.2, 0, 0, 1] as const } } };
const itemV = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0, 0, 1] as const } } };

const HealthGauge = ({ score, maxScore }: { score: number; maxScore: number }) => {
  const pct = Math.min((score / maxScore) * 100, 100);
  const color = gradeColor(score);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r="70" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: [0.2, 0, 0, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-4xl font-bold font-mono" style={{ color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">/ {maxScore}</span>
      </div>
    </div>
  );
};

const AnimatedStatCard = ({ label, value, icon: Icon, cls }: { label: string; value: number; icon: React.ElementType; cls: string }) => {
  const animated = useAnimatedNumber(value);
  return (
    <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${cls}`} />
      </div>
      <p className={`text-2xl font-semibold font-mono tabular-nums ${cls}`}>{formatZAR(animated)}</p>
    </motion.div>
  );
};

const AnimatedRateCard = ({ rate }: { rate: number }) => {
  const animated = useAnimatedNumber(rate);
  return (
    <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Savings Rate</span>
        <Percent className="h-4 w-4 text-primary" />
      </div>
      <p className="text-2xl font-semibold font-mono tabular-nums text-primary">{animated.toFixed(1)}%</p>
    </motion.div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard').catch(() => ({ data: null })),
      api.get('/api/dashboard/health').catch(() => ({ data: null })),
      api.get('/api/dashboard/profile').catch(() => ({ data: null })),
    ]).then(([d, h, p]) => {
      setData(d.data);
      setHealth(h.data);
      setProfile(p.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><CardSkeleton /><CardSkeleton /></div>
      </div>
    );
  }

  const stats = [
    { label: 'Monthly Income', value: data?.monthlyIncome ?? 0, icon: TrendingUp, cls: 'text-success' },
    { label: 'Monthly Expenses', value: data?.monthlyExpenses ?? 0, icon: TrendingDown, cls: 'text-destructive' },
    { label: 'Monthly Savings', value: data?.monthlySavings ?? 0, icon: PiggyBank, cls: 'text-primary' },
  ];

  const savingsRate = data?.savingsRate ?? 0;
  const totalPts = profile?.totalPoints ?? data?.totalPoints ?? 0;
  const level = profile?.level ?? data?.level ?? 1;
  const tier = profile?.tier ?? data?.tier ?? 'Bronze';
  const streak = data?.currentStreak ?? 0;
  const ptsToNext = profile?.pointsToNextLevel ?? 100;
  const ptsProgress = Math.min((totalPts / (totalPts + ptsToNext)) * 100, 100);

  const healthScore = health?.totalScore ?? data?.healthScore ?? 0;
  const healthMax = health?.maxScore ?? 100;

  const donutData = [
    { name: 'Score', value: healthScore },
    { name: 'Remaining', value: healthMax - healthScore },
  ];

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
      <motion.h1 variants={itemV} className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</motion.h1>

      {/* Quick Stats */}
      <div data-tour="stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <AnimatedStatCard key={s.label} label={s.label} value={s.value} icon={s.icon} cls={s.cls} />
        ))}
        <AnimatedRateCard rate={savingsRate} />
      </div>

      {/* Gamification Bar */}
      <motion.div data-tour="gamification" variants={itemV} className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Badge variant="secondary" className="font-mono">Level {level}</Badge>
          <Badge className={`border ${tierColors[tier] || tierColors.Bronze}`}>{tier}</Badge>
          <span className="text-sm font-mono text-foreground"><Zap className="inline h-3.5 w-3.5 text-primary mr-1" />{totalPts} pts</span>
          {streak > 0 && <span className="text-sm">🔥 {streak} day streak</span>}
        </div>
        <div className="flex items-center gap-3">
          <Progress value={ptsProgress} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{ptsToNext} pts to next level</span>
        </div>
      </motion.div>

      {/* Health Score + Daily Tip Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Score */}
        <motion.div data-tour="health" variants={itemV} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Financial Health Score</h2>
          <HealthGauge score={healthScore} maxScore={healthMax} />
          <p className="text-center mt-2 text-sm font-medium" style={{ color: gradeColor(healthScore) }}>
            {health?.grade || gradeText(healthScore)}
          </p>
          {health?.categories && (
            <div className="mt-5 space-y-3">
              {health.categories.map((cat) => (
                <div key={cat.name} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{cat.name}</span>
                    <span className="font-mono text-foreground">{cat.score}/{cat.maxScore}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: gradeColor((cat.score / cat.maxScore) * 100) }}
                      initial={{ width: 0 }} animate={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{cat.tip}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right Column: Tip + Mini Cards */}
        <div className="space-y-6">
          {/* Daily Tip */}
          {data?.dailyTip && (
            <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground">{data.dailyTip.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{data.dailyTip.category}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{data.dailyTip.difficulty}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{data.dailyTip.content}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mini Cards Row */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Budgets</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {data?.budgetsOnTrack ?? 0}<span className="text-muted-foreground font-normal text-sm"> / {data?.totalBudgets ?? 0}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">on track</p>
            </motion.div>

            <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Savings Goals</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{data?.activeSavingsGoals ?? 0} <span className="text-muted-foreground font-normal text-sm">active</span></p>
              <div className="mt-2">
                <Progress value={data?.totalSavingsGoalProgress ?? 0} className="h-1.5" />
                <span className="text-[10px] text-muted-foreground mt-1">{(data?.totalSavingsGoalProgress ?? 0).toFixed(0)}% overall</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div data-tour="activity" variants={itemV} className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Activity</h2>
          <Link to="/achievements" className="text-xs text-primary hover:underline">View Achievements →</Link>
        </div>
        {(!data?.recentActivity || data.recentActivity.length === 0) ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No recent activity. Start tracking to earn points! 🚀</p>
        ) : (
          <div className="space-y-1">
            {data.recentActivity.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground truncate">{a.description}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-success">+{a.points}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(a.timestamp).toLocaleDateString('en-ZA')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
