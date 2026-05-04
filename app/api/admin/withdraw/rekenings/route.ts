import { NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET() {
  try {
    const data = await apiGet('/v1/h2h/list/rekening');
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
