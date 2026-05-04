import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');
    if (!orderId) return NextResponse.json({ error: 'order_id required' }, { status: 400 });
    const data = await apiGet('/v1/orders/set_status', { order_id: orderId, status: 'cancel' });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
