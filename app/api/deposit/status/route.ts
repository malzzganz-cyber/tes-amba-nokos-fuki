import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get('deposit_id');
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!depositId) {
      return NextResponse.json({ error: 'deposit_id required' }, { status: 400 });
    }

    // 1. Cek status ke RumahOTP (server-side)
    const data = await apiGet('/v2/deposit/get_status', { deposit_id: depositId });
    const status = (data.status ?? '').toLowerCase();

    // 2. Jika sukses, auto credit balance di server (tidak bisa dimanipulasi frontend)
    if (status === 'success') {
      // Verifikasi token jika ada (opsional — tetap aman karena pakai deposit_id unik)
      let uid: string | null = null;
      if (token) {
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          uid = decoded.uid;
        } catch {}
      }

      // Cari transaksi berdasarkan deposit_id
      const txQuery = adminDb.collection('transactions')
        .where('deposit_id', '==', depositId)
        .where('status', '!=', 'success') // hanya proses sekali
        .limit(1);

      const txSnap = await txQuery.get();

      if (!txSnap.empty) {
        const tx = txSnap.docs[0];
        const txData = tx.data();
        const txUid = txData.uid;
        const amount = txData.amount ?? 0;

        // Gunakan transaction Firestore agar atomic (tidak double credit)
        await adminDb.runTransaction(async (t) => {
          const userRef = adminDb.collection('users').doc(txUid);
          const userSnap = await t.get(userRef);
          
          if (!userSnap.exists) return;

          // Re-check status inside transaction
          const txRef = tx.ref;
          const latestTx = await t.get(txRef);
          if (latestTx.data()?.status === 'success') return; // sudah diproses

          t.update(userRef, {
            balance: FieldValue.increment(amount),
          });
          t.update(txRef, {
            status: 'success',
            creditedAt: new Date(),
          });
        });
      }
    }

    // 3. Return status ke frontend
    return NextResponse.json({ ...data, status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
