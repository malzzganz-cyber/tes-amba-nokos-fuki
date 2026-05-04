'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import BottomNav from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { LogOut, CreditCard, ShoppingBag, Trophy, Wallet, ChevronRight, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, loading, refreshUserData } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      refreshUserData();
      fetchRecentOrders();
    }
  }, [user]);

  const fetchRecentOrders = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'orders'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snap = await getDocs(q);
      setRecentOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setRecentOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 pt-12 pb-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm">Selamat datang 👋</p>
            <h1 className="text-xl font-extrabold mt-0.5 truncate max-w-[220px]">
              {userData?.email?.split('@')[0] ?? 'User'}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="mt-6 bg-white/20 backdrop-blur rounded-2xl p-5 border border-white/30">
          <p className="text-white/70 text-xs font-medium">Saldo Kamu</p>
          <p className="text-3xl font-extrabold mt-1">
            Rp {(userData?.balance ?? 0).toLocaleString('id-ID')}
          </p>
          <div className="flex gap-2 mt-4">
            <Link
              href="/deposit"
              className="flex-1 bg-white text-indigo-600 font-bold text-sm py-2.5 rounded-xl text-center hover:bg-indigo-50 transition-colors"
            >
              + Deposit
            </Link>
            <Link
              href="/order"
              className="flex-1 bg-white/20 text-white font-semibold text-sm py-2.5 rounded-xl text-center border border-white/30 hover:bg-white/30 transition-colors"
            >
              Order OTP
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <QuickCard href="/deposit" icon={<CreditCard className="w-5 h-5 text-indigo-500" />} label="Deposit" />
          <QuickCard href="/order" icon={<ShoppingBag className="w-5 h-5 text-indigo-500" />} label="Order" />
          <QuickCard href="/leaderboard" icon={<Trophy className="w-5 h-5 text-indigo-500" />} label="Ranking" />
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="px-6 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-amber-800 font-bold text-sm mb-3">👑 Admin Panel</p>
            <div className="flex gap-2">
              <Link
                href="/admin/withdraw"
                className="flex-1 bg-amber-500 text-white text-sm font-semibold py-2 rounded-xl text-center hover:bg-amber-600 transition-colors"
              >
                Withdraw
              </Link>
              <Link
                href="/admin/balance"
                className="flex-1 bg-amber-100 text-amber-700 text-sm font-semibold py-2 rounded-xl text-center hover:bg-amber-200 transition-colors"
              >
                Admin Balance
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Order Terbaru</h2>
          <Link href="/history" className="text-indigo-500 text-sm font-medium flex items-center gap-1">
            Lihat semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Belum ada order</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{order.number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.service ?? 'OTP Service'}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCard({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
    >
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </Link>
  );
}
