'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import BottomNav from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { Loader2, ArrowLeft, RefreshCw, X } from 'lucide-react';

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export default function DepositPage() {
  const router = useRouter();
  const { user, userData, loading, refreshUserData } = useAuth();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'qris'>('input');
  const [qrisData, setQrisData] = useState<any>(null);
  const [depositStatus, setDepositStatus] = useState<string>('pending');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user, loading]);

  const createDeposit = async () => {
    const num = parseInt(amount);
    if (!num || num < 2000) return setError('Minimal deposit Rp 2.000');
    setError('');
    setCreating(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/deposit/create?amount=${num}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal membuat QRIS');
      setQrisData(data);
      setDepositStatus('pending');
      setStep('qris');
      startPolling(data.deposit_id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const startPolling = (depositId: string) => {
    const checkStatus = async () => {
      try {
        // Token dikirim ke backend -> balance di-credit server-side (aman, tidak bisa dimanipulasi)
        const token = await user!.getIdToken();
        const res = await fetch(`/api/deposit/status?deposit_id=${depositId}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const st = (data.status ?? '').toLowerCase();
        setDepositStatus(st);
        if (st === 'success') {
          clearInterval(pollingRef.current!);
          await refreshUserData();
        } else if (st === 'cancel' || st === 'expired') {
          clearInterval(pollingRef.current!);
        }
      } catch {}
    };
    // Cek pertama setelah 5 detik, lalu tiap 60 detik
    setTimeout(checkStatus, 5000);
    pollingRef.current = setInterval(checkStatus, 60000);
  };

  const cancelDeposit = async () => {
    if (!qrisData?.deposit_id) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    try {
      await fetch(`/api/deposit/cancel?deposit_id=${qrisData.deposit_id}`);
    } catch {}
    setStep('input');
    setQrisData(null);
    setAmount('');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 pt-12 pb-8 text-white">
        <button onClick={() => step === 'qris' ? setStep('input') : router.back()} className="mb-4 flex items-center gap-2 text-white/80 text-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <h1 className="text-xl font-extrabold">Deposit QRIS</h1>
        <p className="text-white/70 text-sm mt-1">Top up saldo via QRIS otomatis</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
          <span>Saldo:</span>
          <span className="font-bold">Rp {(userData?.balance ?? 0).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="px-6 py-6 -mt-2 bg-white rounded-t-3xl">
        {step === 'input' && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nominal Deposit</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimal 2.000"
                  className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Nominal Cepat</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      amount === String(a)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {(a / 1000).toLocaleString('id-ID')}rb
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              onClick={createDeposit}
              disabled={creating || !amount}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {creating ? 'Membuat QRIS...' : 'Buat QRIS'}
            </button>
          </div>
        )}

        {step === 'qris' && qrisData && (
          <div className="space-y-5">
            <div className="bg-indigo-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-indigo-600 font-semibold mb-1">SCAN QRIS UNTUK BAYAR</p>
              <p className="text-2xl font-extrabold text-indigo-800">
                Rp {parseInt(amount).toLocaleString('id-ID')}
              </p>
            </div>

            {/* QRIS Image from API */}
            {qrisData.qris_url || qrisData.qr_string ? (
              <div className="flex justify-center">
                {qrisData.qris_url ? (
                  <img
                    src={qrisData.qris_url}
                    alt="QRIS Code"
                    className="w-56 h-56 rounded-2xl border-4 border-indigo-100 object-contain"
                  />
                ) : (
                  <div className="bg-white border-4 border-indigo-100 rounded-2xl p-4 w-56 h-56 flex items-center justify-center">
                    <p className="text-xs text-gray-500 text-center break-all">{qrisData.qr_string}</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-1"><StatusBadge status={depositStatus} /></div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">ID Deposit</p>
                <p className="text-xs font-mono text-gray-700 mt-1">{qrisData.deposit_id}</p>
              </div>
            </div>

            {depositStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold">✅ Deposit Berhasil!</p>
                <p className="text-green-600 text-sm mt-1">Saldo telah ditambahkan ke akun kamu</p>
              </div>
            )}

            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Otomatis cek status setiap 60 detik
            </div>

            {depositStatus !== 'success' && (
              <button
                onClick={cancelDeposit}
                className="w-full border border-red-200 text-red-500 font-semibold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Batalkan
              </button>
            )}

            {depositStatus === 'success' && (
              <button
                onClick={() => { setStep('input'); setAmount(''); setQrisData(null); }}
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Deposit Lagi
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
