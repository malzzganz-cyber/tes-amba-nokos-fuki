'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Zap, Shield, Clock, ChevronRight, X } from 'lucide-react';

export default function LandingPage() {
  const [audioPopup, setAudioPopup] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setAudioPopup(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Audio Popup */}
      {audioPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-6 shadow-2xl text-center max-w-[340px] w-full">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔊</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Welcome to Malzz Nokos!</h3>
            <p className="text-gray-500 text-sm mb-5">Aktifkan audio untuk pengalaman terbaik.</p>
            <button
              onClick={playAudio}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl mb-3 hover:bg-indigo-700 transition-colors"
            >
              Aktifkan Audio 🎵
            </button>
            <button
              onClick={() => setAudioPopup(false)}
              className="w-full text-gray-400 text-sm py-2"
            >
              Lewati
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} src="https://files.catbox.moe/dwjqgv.mp3" />

      {/* Hero */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 pt-16 pb-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Platform Aktif 24/7
            </div>
            
            <h1 className="text-3xl font-extrabold mb-3 leading-tight">
              Malzz Nokos 🚀
            </h1>
            <p className="text-white/80 text-base leading-relaxed mb-8">
              Platform cepat &amp; simpel untuk membeli nomor virtual &amp; menerima OTP otomatis.
            </p>

            <div className="flex gap-3">
              <Link
                href="/register"
                className="flex-1 bg-white text-indigo-600 font-bold py-3.5 rounded-xl text-center text-sm hover:bg-indigo-50 transition-colors"
              >
                Daftar Gratis
              </Link>
              <Link
                href="/login"
                className="flex-1 bg-white/20 backdrop-blur text-white font-semibold py-3.5 rounded-xl text-center text-sm hover:bg-white/30 transition-colors border border-white/30"
              >
                Masuk
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-8 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">Mengapa Malzz Nokos?</h2>

          <FeatureCard
            icon={<Zap className="w-5 h-5 text-indigo-500" />}
            title="OTP Instan"
            desc="Terima kode OTP dalam hitungan detik dari ribuan layanan."
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5 text-indigo-500" />}
            title="100% Aman"
            desc="Transaksi diproteksi. Saldo tidak bisa diubah dari sisi klien."
          />
          <FeatureCard
            icon={<Clock className="w-5 h-5 text-indigo-500" />}
            title="Deposit QRIS"
            desc="Top up saldo cepat via QRIS, otomatis terkonfirmasi."
          />

          <div className="pt-4">
            <Link
              href="/register"
              className="flex items-center justify-between bg-indigo-50 rounded-xl p-4 group hover:bg-indigo-100 transition-colors"
            >
              <div>
                <p className="font-semibold text-indigo-700 text-sm">Mulai Sekarang</p>
                <p className="text-indigo-400 text-xs">Daftar gratis, langsung bisa order</p>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-6 pb-8 text-center text-xs text-gray-400">
          <p>Developed by <span className="font-semibold text-gray-600">Malzz</span></p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
