import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';
import { Trophy, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalPoints: number;
  level: number;
  tier: string;
  currentStreak: number;
}

const tierColors: Record<string, string> = {
  Bronze: 'bg-amber-700/20 text-amber-400 border-amber-700/40',
  Silver: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  Gold: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
  Platinum: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
  Diamond: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
};

const rankStyle = (rank: number) => {
  if (rank === 1) return 'text-yellow-400 font-bold';
  if (rank === 2) return 'text-gray-300 font-bold';
  if (rank === 3) return 'text-amber-600 font-bold';
  return 'text-muted-foreground';
};

const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemV = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard/leaderboard?limit=20').then((r) => setEntries(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEntries([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><h1 className="text-2xl font-semibold">Leaderboard</h1><CardSkeleton /><CardSkeleton /></div>;

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemV} className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Leaderboard</h1>
      </motion.div>

      <motion.div variants={itemV} className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium w-16">Rank</th>
              <th className="text-left py-3 px-4 font-medium">Player</th>
              <th className="text-right py-3 px-4 font-medium">Points</th>
              <th className="text-center py-3 px-4 font-medium hidden sm:table-cell">Level</th>
              <th className="text-center py-3 px-4 font-medium hidden sm:table-cell">Tier</th>
              <th className="text-center py-3 px-4 font-medium hidden md:table-cell">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const isMe = e.userId === user?.id;
              return (
                <motion.tr key={e.rank} variants={itemV}
                  className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${isMe ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}>
                  <td className={`py-3 px-4 font-mono ${rankStyle(e.rank)}`}>
                    {e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : `#${e.rank}`}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${isMe ? 'text-primary' : 'text-foreground'}`}>{e.displayName} {isMe && '(You)'}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-foreground">{e.totalPoints.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center hidden sm:table-cell">
                    <Badge variant="secondary" className="font-mono text-[10px]">Lv.{e.level}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center hidden sm:table-cell">
                    <Badge className={`border text-[10px] ${tierColors[e.tier] || tierColors.Bronze}`}>{e.tier}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center hidden md:table-cell">
                    {e.currentStreak > 0 ? <span className="text-xs">🔥 {e.currentStreak}</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">No leaderboard data yet. Start earning points! 🚀</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Leaderboard;
