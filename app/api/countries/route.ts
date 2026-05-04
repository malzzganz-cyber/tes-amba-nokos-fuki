import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('service_id');
    if (!serviceId) return NextResponse.json({ error: 'service_id required' }, { status: 400 });
    const data = await apiGet('/v2/countries', { service_id: serviceId });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
