'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import BottomNav from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { Loader2, ArrowLeft, Search, RefreshCw, X, Copy, CheckCheck } from 'lucide-react';

type Step = 'service' | 'country' | 'operator' | 'result';

export default function OrderPage() {
  const router = useRouter();
  const { user, userData, loading, refreshUserData } = useAuth();

  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);

  const [orderResult, setOrderResult] = useState<any>(null);
  const [otpStatus, setOtpStatus] = useState<string>('pending');
  const [otpCode, setOtpCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user, loading]);

  useEffect(() => { if (user) loadServices(); }, [user]);

  const loadServices = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : data.data ?? []);
    } catch { setError('Gagal memuat layanan'); }
    finally { setFetching(false); }
  };

  const loadCountries = async (service: any) => {
    setSelectedService(service);
    setFetching(true);
    setStep('country');
    setSearchQuery('');
    try {
      const res = await fetch(`/api/countries?service_id=${service.id ?? service.service_id}`);
      const data = await res.json();
      setCountries(Array.isArray(data) ? data : data.data ?? []);
    } catch { setError('Gagal memuat negara'); }
    finally { setFetching(false); }
  };

  const loadOperators = async (country: any) => {
    setSelectedCountry(country);
    setFetching(true);
    setStep('operator');
    setSearchQuery('');
    try {
      const res = await fetch(`/api/operators?country=${encodeURIComponent(country.name ?? country.country)}&provider_id=${selectedService?.id ?? selectedService?.service_id}`);
      const data = await res.json();
      setOperators(Array.isArray(data) ? data : data.data ?? []);
    } catch { setError('Gagal memuat operator'); }
    finally { setFetching(false); }
  };

  const placeOrder = async (operator: any) => {
    setSelectedOperator(operator);
    const isAny = operator.name?.toLowerCase() === 'any' || operator.operator_id === 'any';
    setOrdering(true);
    setError('');
    try {
      const balance = userData?.balance ?? 0;
      const price = operator.price ?? operator.cost ?? 0;
      const markup = price <= 15000 ? price + 500 : price + 1000;
      if (balance < markup) {
        setError(`Saldo tidak cukup. Butuh Rp ${markup.toLocaleString('id-ID')}`);
        setOrdering(false);
        return;
      }

      const params: Record<string, string> = {
        number_id: selectedService?.id ?? selectedService?.service_id,
        provider_id: selectedService?.id ?? selectedService?.service_id,
      };
      if (!isAny) params.operator_id = operator.id ?? operator.operator_id;

      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/orders?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal order');

      // Deduct balance
      await updateDoc(doc(db, 'users', user!.uid), {
        balance: balance - markup,
      });
      await refreshUserData();

      // Save order to Firestore
      await addDoc(collection(db, 'orders'), {
        uid: user!.uid,
        order_id: data.order_id ?? data.id,
        number: data.number ?? data.phone,
        status: 'pending',
        service: selectedService?.name,
        country: selectedCountry?.name,
        operator: isAny ? 'any' : (operator.name ?? operator.operator_id),
        price: markup,
        createdAt: serverTimestamp(),
      });

      setOrderResult(data);
      setOtpStatus('pending');
      setStep('result');
      startOtpPolling(data.order_id ?? data.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOrdering(false);
    }
  };

  const startOtpPolling = (orderId: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/status?order_id=${orderId}`);
        const data = await res.json();
        const st = data.status?.toLowerCase();
        setOtpStatus(st);
        if (data.otp || data.sms_code) {
          setOtpCode(data.otp ?? data.sms_code);
          clearInterval(pollingRef.current!);
        }
        if (st === 'cancel' || st === 'expired') clearInterval(pollingRef.current!);
      } catch {}
    }, 60000);
  };

  const cancelOrder = async () => {
    if (!orderResult) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    try {
      await fetch(`/api/orders/cancel?order_id=${orderResult.order_id ?? orderResult.id}`);
      setOtpStatus('cancel');
    } catch {}
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(orderResult?.number ?? orderResult?.phone ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = (list: any[], field: string) =>
    list.filter((i) => (i[field] ?? '').toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  const stepBack = () => {
    if (step === 'country') setStep('service');
    else if (step === 'operator') setStep('country');
    else if (step === 'result') { setStep('service'); setOrderResult(null); if (pollingRef.current) clearInterval(pollingRef.current!); }
    setSearchQuery('');
    setError('');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 pt-12 pb-8 text-white">
        {step !== 'service' && (
          <button onClick={stepBack} className="mb-4 flex items-center gap-2 text-white/80 text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}
        <h1 className="text-xl font-extrabold">Order Nomor OTP</h1>
        <p className="text-white/70 text-sm mt-1">
          {step === 'service' && 'Pilih layanan'}
          {step === 'country' && `Layanan: ${selectedService?.name}`}
          {step === 'operator' && `${selectedService?.name} · ${selectedCountry?.name ?? selectedCountry?.country}`}
          {step === 'result' && 'Nomor Aktif'}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
          <span>Saldo:</span>
          <span className="font-bold">Rp {(userData?.balance ?? 0).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="px-6 py-6 -mt-2 bg-white rounded-t-3xl">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        {/* STEP: SERVICE */}
        {step === 'service' && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari layanan..."
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {fetching ? <LoadingSpinner /> : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {filtered(services, 'name').map((s, i) => (
                  <button
                    key={i}
                    onClick={() => loadCountries(s)}
                    className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                      {s.price && <p className="text-xs text-gray-400 mt-0.5">Rp {Number(s.price).toLocaleString('id-ID')}</p>}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP: COUNTRY */}
        {step === 'country' && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari negara..."
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {fetching ? <LoadingSpinner /> : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {filtered(countries, 'name').map((c, i) => (
                  <button
                    key={i}
                    onClick={() => loadOperators(c)}
                    className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {c.flag && <span className="text-xl">{c.flag}</span>}
                      <p className="font-semibold text-gray-900 text-sm">{c.name ?? c.country}</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP: OPERATOR */}
        {step === 'operator' && (
          <>
            {fetching ? <LoadingSpinner /> : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {operators.map((op, i) => {
                  const price = op.price ?? op.cost ?? 0;
                  const markup = price <= 15000 ? price + 500 : price + 1000;
                  return (
                    <button
                      key={i}
                      onClick={() => placeOrder(op)}
                      disabled={ordering}
                      className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{op.name ?? op.operator_id}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Stok: {op.count ?? op.stock ?? '∞'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600 text-sm">Rp {markup.toLocaleString('id-ID')}</p>
                          <p className="text-xs text-gray-400 line-through">Rp {Number(price).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      {ordering && <div className="mt-2 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* STEP: RESULT */}
        {step === 'result' && orderResult && (
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-2xl p-5">
              <p className="text-xs text-indigo-500 font-semibold mb-1">NOMOR VIRTUAL KAMU</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-extrabold text-indigo-800 flex-1">
                  {orderResult.number ?? orderResult.phone}
                </p>
                <button onClick={copyNumber} className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Status OTP</p>
                <div className="mt-1"><StatusBadge status={otpStatus} /></div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="text-xs font-mono text-gray-700 mt-1">{orderResult.order_id ?? orderResult.id}</p>
              </div>
            </div>

            {otpCode ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
                <p className="text-xs text-green-600 font-semibold mb-1">KODE OTP DITERIMA ✅</p>
                <p className="text-3xl font-extrabold text-green-800 tracking-widest">{otpCode}</p>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 py-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Menunggu OTP… cek otomatis tiap 60 detik
              </div>
            )}

            {otpStatus !== 'cancel' && !otpCode && (
              <button
                onClick={cancelOrder}
                className="w-full border border-red-200 text-red-500 font-semibold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Batalkan Order
              </button>
            )}

            {(otpCode || otpStatus === 'cancel') && (
              <button
                onClick={() => { setStep('service'); setOrderResult(null); setOtpCode(''); if (pollingRef.current) clearInterval(pollingRef.current!); }}
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Order Lagi
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
    </div>
  );
}
