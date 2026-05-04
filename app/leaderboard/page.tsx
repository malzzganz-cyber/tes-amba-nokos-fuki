'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import BottomNav from '@/components/BottomNav';
import { Loader2, Trophy, TrendingUp } from 'lucide-react';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [topBalance, setTopBalance] = useState<any[]>([]);
  const [topTransactions, setTopTransactions] = useState<any[]>([]);
  const [tab, setTab] = useState<'balance' | 'transactions'>('balance');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    setFetching(true);
    try {
      const bq = query(collection(db, 'users'), orderBy('balance', 'desc'), limit(10));
      const bSnap = await getDocs(bq);
      setTopBalance(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Count orders per user
      const txMap: Record<string, number> = {};
      const oSnap = await getDocs(collection(db, 'orders'));
      oSnap.docs.forEach((d) => {
        const uid = d.data().uid;
        txMap[uid] = (txMap[uid] ?? 0) + 1;
      });
      const uSnap = await getDocs(collection(db, 'users'));
      const users = uSnap.docs.map((d) => ({ ...d.data(), id: d.id, txCount: txMap[d.id] ?? 0 }));
      users.sort((a: any, b: any) => b.txCount - a.txCount);
      setTopTransactions(users.slice(0, 10));
    } catch {
      setTopBalance([]); setTopTransactions([]);
    } finally {
      setFetching(false);
    }
  };

  const medalEmoji = (i: number) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  const currentList = tab === 'balance' ? topBalance : topTransactions;

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 pt-12 pb-8 text-white">
        <h1 className="text-xl font-extrabold">🏆 Leaderboard</h1>
        <p className="text-white/70 text-sm mt-1">Top pengguna Malzz Nokos</p>
      </div>

      <div className="px-6 py-5 -mt-2 bg-white rounded-t-3xl">
        <div className="flex gap-2 mb-5 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('balance')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'balance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Trophy className="w-4 h-4" /> Top Saldo
          </button>
          <button
            onClick={() => setTab('transactions')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'transactions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
          >
            <TrendingUp className="w-4 h-4" /> Top Transaksi
          </button>
        </div>

        {fetching ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {currentList.map((u: any, i) => (
              <div
                key={u.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  u.id === user?.uid ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'
                } ${i < 3 ? 'shadow-sm' : ''}`}
              >
                <div className="w-10 text-center text-xl font-bold">
                  {medalEmoji(i)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {u.email?.split('@')[0]}
                    {u.id === user?.uid && <span className="ml-1 text-indigo-500 text-xs">(kamu)</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                </div>
                <div className="text-right">
                  {tab === 'balance' ? (
                    <p className="font-bold text-indigo-600 text-sm">Rp {(u.balance ?? 0).toLocaleString('id-ID')}</p>
                  ) : (
                    <p className="font-bold text-indigo-600 text-sm">{u.txCount} order</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
