import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bankCode = searchParams.get('bank_code');
    const accountNumber = searchParams.get('account_number');
    if (!bankCode || !accountNumber) {
      return NextResponse.json({ error: 'bank_code dan account_number required' }, { status: 400 });
    }
    const data = await apiGet('/v1/h2h/check/rekening', { bank_code: bankCode, account_number: accountNumber });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
