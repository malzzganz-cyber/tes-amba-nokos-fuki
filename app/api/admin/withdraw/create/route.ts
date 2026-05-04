import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target');
    const id = searchParams.get('id');
    if (!target || !id) {
      return NextResponse.json({ error: 'target dan id required' }, { status: 400 });
    }
    const data = await apiGet('/v1/h2h/transaksi/create', { target, id });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
