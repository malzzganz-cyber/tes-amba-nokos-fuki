'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, ArrowLeft, RefreshCw, Wallet } from 'lucide-react';

export default function AdminBalancePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.uid !== process.env.NEXT_PUBLIC_ADMIN_UID) { router.push('/dashboard'); return; }
      fetchBalance();
    }
  }, [user, loading]);

  const fetchBalance = async () => {
    setFetching(true);
    setError('');
    try {
      const res = await fetch('/api/admin/balance');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal memuat saldo');
      setBalance(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-amber-500 to-amber-400 px-6 pt-12 pb-8 text-white">
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2 text-white/80 text-sm">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <h1 className="text-xl font-extrabold">👑 Admin Balance</h1>
        <p className="text-white/70 text-sm mt-1">Saldo RumahOTP real-time</p>
      </div>

      <div className="px-6 py-6 -mt-2 bg-white rounded-t-3xl">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        {fetching ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
        ) : balance ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <p className="text-amber-600 text-sm font-semibold">Saldo RumahOTP</p>
              <p className="text-4xl font-extrabold text-amber-800 mt-2">
                Rp {Number(balance.balance ?? balance.saldo ?? 0).toLocaleString('id-ID')}
              </p>
              {balance.username && (
                <p className="text-amber-500 text-xs mt-2">{balance.username}</p>
              )}
            </div>

            {balance.deposit_balance !== undefined && (
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-sm text-gray-600">Saldo Deposit</span>
                <span className="font-bold text-indigo-600">Rp {Number(balance.deposit_balance).toLocaleString('id-ID')}</span>
              </div>
            )}

            <button
              onClick={fetchBalance}
              className="w-full flex items-center justify-center gap-2 border border-amber-200 text-amber-600 font-semibold py-3 rounded-xl hover:bg-amber-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Saldo
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
