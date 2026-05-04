import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transaksiId = searchParams.get('transaksi_id');
    if (!transaksiId) {
      return NextResponse.json({ error: 'transaksi_id required' }, { status: 400 });
    }
    const data = await apiGet('/v1/h2h/transaksi/status', { transaksi_id: transaksiId });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
