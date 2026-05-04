import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get('deposit_id');
    if (!depositId) return NextResponse.json({ error: 'deposit_id required' }, { status: 400 });
    const data = await apiGet('/v1/deposit/cancel', { deposit_id: depositId });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
