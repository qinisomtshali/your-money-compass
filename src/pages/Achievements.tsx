import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  difficulty: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

interface PointEntry {
  points: number;
  reason: string;
  category: string;
  timestamp: string;
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-success/20 text-success',
  Medium: 'bg-blue-500/20 text-blue-400',
  Hard: 'bg-orange-500/20 text-orange-400',
  Epic: 'bg-purple-500/20 text-purple-400',
  Legendary: 'bg-yellow-500/20 text-yellow-400',
};

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemV = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [points, setPoints] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/achievements').catch(() => ({ data: [] })),
      api.get('/api/dashboard/points').catch(() => ({ data: [] })),
    ]).then(([a, p]) => {
      setAchievements(Array.isArray(a.data) ? a.data : []);
      setPoints(Array.isArray(p.data) ? p.data : p.data?.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><h1 className="text-2xl font-semibold">Achievements</h1><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div></div>;

  const unlocked = achievements.filter((a) => a.isUnlocked);
  const locked = achievements.filter((a) => !a.isUnlocked);

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-8">
      <motion.h1 variants={itemV} className="text-2xl font-semibold tracking-tight text-foreground">Achievements</motion.h1>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">🏆 Unlocked ({unlocked.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((a) => (
              <motion.div key={a.id} variants={itemV}
                className="rounded-xl border border-primary/30 bg-card p-5 ring-1 ring-primary/10">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground">{a.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-mono">+{a.points} pts</Badge>
                      <Badge className={`text-[10px] ${difficultyColors[a.difficulty] || ''}`}>{a.difficulty}</Badge>
                      <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                    </div>
                    {a.unlockedAt && <p className="text-[10px] text-muted-foreground mt-1.5">Unlocked {new Date(a.unlockedAt).toLocaleDateString('en-ZA')}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">🔒 Locked ({locked.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((a) => (
              <motion.div key={a.id} variants={itemV}
                className="rounded-xl border border-border bg-card/50 p-5 opacity-60">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <span className="text-3xl grayscale">{a.icon}</span>
                    <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-muted-foreground">{a.name}</h3>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{a.description}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-mono">+{a.points} pts</Badge>
                      <Badge className={`text-[10px] ${difficultyColors[a.difficulty] || ''}`}>{a.difficulty}</Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Points History */}
      {points.length > 0 && (
        <motion.div variants={itemV} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Points History</h2>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {points.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/30">
                <div className="flex items-center gap-3 min-w-0">
                  <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">{p.reason}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{p.category}</Badge>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-success">+{p.points}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(p.timestamp).toLocaleDateString('en-ZA')}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Achievements;
