'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import BottomNav from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { Loader2, ShoppingBag, CreditCard } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tab, setTab] = useState<'orders' | 'deposits'>('orders');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setFetching(true);
    try {
      const oq = query(collection(db, 'orders'), where('uid', '==', user!.uid), orderBy('createdAt', 'desc'));
      const tq = query(collection(db, 'transactions'), where('uid', '==', user!.uid), orderBy('createdAt', 'desc'));
      const [oSnap, tSnap] = await Promise.all([getDocs(oq), getDocs(tq)]);
      setOrders(oSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTransactions(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setOrders([]); setTransactions([]);
    } finally {
      setFetching(false);
    }
  };

  const fmtDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 pt-12 pb-8 text-white">
        <h1 className="text-xl font-extrabold">Riwayat</h1>
        <p className="text-white/70 text-sm mt-1">Semua aktivitas kamu</p>
      </div>

      <div className="px-6 py-5 -mt-2 bg-white rounded-t-3xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('orders')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Order OTP
          </button>
          <button
            onClick={() => setTab('deposits')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'deposits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
          >
            <CreditCard className="w-4 h-4" /> Deposit
          </button>
        </div>

        {fetching ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : tab === 'orders' ? (
          orders.length === 0 ? (
            <Empty icon={<ShoppingBag />} text="Belum ada order" />
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{o.number}</p>
                      <p className="text-xs text-gray-400">{o.service} · {o.country}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{fmtDate(o.createdAt)}</span>
                    {o.price && <span className="text-xs font-semibold text-indigo-600">Rp {o.price?.toLocaleString('id-ID')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          transactions.length === 0 ? (
            <Empty icon={<CreditCard />} text="Belum ada deposit" />
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Deposit QRIS</p>
                      <p className="text-xs text-gray-400 font-mono">{t.deposit_id}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{fmtDate(t.createdAt)}</span>
                    <span className="text-xs font-bold text-green-600">+Rp {t.amount?.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="w-12 h-12 mx-auto mb-3 opacity-30">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
