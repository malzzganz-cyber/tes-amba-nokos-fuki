'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import BottomNav from '@/components/BottomNav';
import { MessageCircle, Phone, Mail, HelpCircle, Loader2 } from 'lucide-react';

export default function SupportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 pt-12 pb-8 text-white">
        <h1 className="text-xl font-extrabold">Bantuan & Support</h1>
        <p className="text-white/70 text-sm mt-1">Hubungi kami jika ada kendala</p>
      </div>

      <div className="px-6 py-6 -mt-2 bg-white rounded-t-3xl space-y-4">
        <a
          href="https://wa.me/6288980873712"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-2xl hover:bg-green-100 transition-colors"
        >
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-green-800">WhatsApp Support</p>
            <p className="text-green-600 text-sm">+62 889-8087-3712</p>
            <p className="text-green-500 text-xs mt-0.5">Respon cepat 24/7</p>
          </div>
        </a>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            FAQ
          </h3>
          <div className="space-y-3">
            {[
              { q: 'Berapa lama deposit diproses?', a: 'Deposit QRIS diproses otomatis dalam 1–5 menit setelah pembayaran.' },
              { q: 'Apakah nomor virtual bisa dipakai ulang?', a: 'Tidak, setiap nomor hanya digunakan sekali untuk satu sesi OTP.' },
              { q: 'Bagaimana jika OTP tidak masuk?', a: 'Batalkan order dan coba lagi dengan operator berbeda. Saldo tidak dipotong jika cancel.' },
              { q: 'Berapa minimal deposit?', a: 'Minimal deposit adalah Rp 2.000.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <p className="font-semibold text-gray-800 text-sm">{item.q}</p>
                <p className="text-gray-500 text-xs mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-4 text-center">
          <p className="text-indigo-600 font-semibold text-sm">Developer</p>
          <p className="text-indigo-800 font-extrabold text-lg mt-1">Malzz 🚀</p>
          <p className="text-indigo-400 text-xs mt-0.5">Malzz Nokos · Platform OTP Terpercaya</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
