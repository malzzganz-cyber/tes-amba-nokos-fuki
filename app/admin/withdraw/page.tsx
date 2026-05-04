'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Loader2, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function WithdrawPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [rekenings, setRekenings] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [txResult, setTxResult] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [step, setStep] = useState<'form' | 'check' | 'result'>('form');

  const [loading2, setLoading2] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.uid !== process.env.NEXT_PUBLIC_ADMIN_UID) { router.push('/dashboard'); return; }
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        fetch('/api/admin/withdraw/products'),
        fetch('/api/admin/withdraw/rekenings'),
      ]);
      const pData = await pRes.json();
      const rData = await rRes.json();
      setProducts(Array.isArray(pData) ? pData : pData.data ?? []);
      setRekenings(Array.isArray(rData) ? rData : rData.data ?? []);
    } catch {
      setError('Gagal memuat data');
    } finally {
      setFetching(false);
    }
  };

  const checkRekening = async () => {
    if (!selectedBank || !accountNumber) return setError('Isi semua field');
    setLoading2(true); setError('');
    try {
      const res = await fetch(`/api/admin/withdraw/check?bank_code=${selectedBank}&account_number=${accountNumber}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal cek rekening');
      setCheckResult(data);
      setStep('check');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading2(false);
    }
  };

  const createWithdraw = async () => {
    if (!selectedProduct || !checkResult) return;
    setLoading2(true); setError('');
    try {
      const res = await fetch(`/api/admin/withdraw/create?target=${accountNumber}&id=${selectedProduct.id ?? selectedProduct.code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal membuat transaksi');
      setTxResult(data);
      setTxStatus(data.status ?? 'pending');
      setStep('result');
      // Save to Firestore
      await addDoc(collection(db, 'withdraws'), {
        uid: user!.uid,
        transaksi_id: data.transaksi_id ?? data.id,
        bank: selectedBank,
        account_number: accountNumber,
        account_name: checkResult.name ?? checkResult.account_name,
        product: selectedProduct.name,
        status: data.status ?? 'pending',
        createdAt: serverTimestamp(),
      });
      startPolling(data.transaksi_id ?? data.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading2(false);
    }
  };

  let pollingInterval: NodeJS.Timeout;
  const startPolling = (id: string) => {
    pollingInterval = setInterval(async () => {
      const res = await fetch(`/api/admin/withdraw/status?transaksi_id=${id}`);
      const data = await res.json();
      setTxStatus(data.status?.toLowerCase());
      if (data.status?.toLowerCase() === 'success' || data.status?.toLowerCase() === 'failed') {
        clearInterval(pollingInterval);
      }
    }, 60000);
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-gradient-to-br from-amber-500 to-amber-400 px-6 pt-12 pb-8 text-white">
        <button onClick={() => step !== 'form' ? setStep('form') : router.push('/dashboard')} className="mb-4 flex items-center gap-2 text-white/80 text-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <h1 className="text-xl font-extrabold">👑 Admin Withdraw</h1>
        <p className="text-white/70 text-sm mt-1">Transfer saldo ke rekening</p>
      </div>

      <div className="px-6 py-6 -mt-2 bg-white rounded-t-3xl space-y-4">
        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

        {step === 'form' && (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Bank / E-Wallet</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">-- Pilih Bank --</option>
                {rekenings.map((r, i) => (
                  <option key={i} value={r.bank_code ?? r.code}>{r.name ?? r.bank_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nomor Rekening</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Masukkan nomor rekening"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Produk Withdraw</label>
              <select
                value={selectedProduct?.id ?? ''}
                onChange={(e) => setSelectedProduct(products.find((p) => (p.id ?? p.code) === e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p, i) => (
                  <option key={i} value={p.id ?? p.code}>{p.name} - Rp {Number(p.price ?? p.amount ?? 0).toLocaleString('id-ID')}</option>
                ))}
              </select>
            </div>

            <button
              onClick={checkRekening}
              disabled={loading2}
              className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading2 && <Loader2 className="w-4 h-4 animate-spin" />}
              Cek Rekening
            </button>
          </>
        )}

        {step === 'check' && checkResult && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-xs text-green-600 font-semibold mb-1">REKENING VALID ✅</p>
              <p className="font-bold text-green-800">{checkResult.name ?? checkResult.account_name}</p>
              <p className="text-green-600 text-sm">{accountNumber} · {selectedBank.toUpperCase()}</p>
            </div>

            {selectedProduct && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-semibold mb-1">PRODUK WITHDRAW</p>
                <p className="font-bold text-amber-800">{selectedProduct.name}</p>
                <p className="text-amber-600 text-sm">Rp {Number(selectedProduct.price ?? selectedProduct.amount ?? 0).toLocaleString('id-ID')}</p>
              </div>
            )}

            <button
              onClick={createWithdraw}
              disabled={loading2}
              className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading2 && <Loader2 className="w-4 h-4 animate-spin" />}
              Proses Withdraw
            </button>
          </>
        )}

        {step === 'result' && txResult && (
          <>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <StatusBadge status={txStatus} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">ID Transaksi</span>
                <span className="text-sm font-mono text-gray-700">{txResult.transaksi_id ?? txResult.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tujuan</span>
                <span className="text-sm font-semibold text-gray-900">{accountNumber}</span>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Cek status otomatis tiap 60 detik
            </div>
          </>
        )}
      </div>
    </div>
  );
}
