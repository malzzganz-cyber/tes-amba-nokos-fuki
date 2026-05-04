import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const amount = searchParams.get('amount');
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!amount || parseInt(amount) < 2000) {
      return NextResponse.json({ error: 'Minimal deposit Rp 2.000' }, { status: 400 });
    }

    // 1. Buat QRIS di RumahOTP (server-side, API key aman)
    const data = await apiGet('/v2/deposit/create', { amount, payment_id: 'qris' });

    // 2. Simpan record transaksi ke Firestore (hanya server yang bisa update balance nanti)
    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        await adminDb.collection('transactions').add({
          uid: decoded.uid,
          deposit_id: data.deposit_id ?? data.id,
          amount: parseInt(amount),
          status: 'pending',
          createdAt: new Date(),
        });
      } catch {}
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
