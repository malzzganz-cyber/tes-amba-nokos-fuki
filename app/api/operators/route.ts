import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country');
    const providerId = searchParams.get('provider_id');
    if (!country || !providerId) return NextResponse.json({ error: 'country & provider_id required' }, { status: 400 });
    const data = await apiGet('/v2/operators', { country, provider_id: providerId });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
