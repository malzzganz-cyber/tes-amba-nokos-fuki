import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const numberId = searchParams.get('number_id');
    const providerId = searchParams.get('provider_id');
    const operatorId = searchParams.get('operator_id'); // optional — null if "any"

    if (!numberId || !providerId) {
      return NextResponse.json({ error: 'number_id and provider_id required' }, { status: 400 });
    }

    const params: Record<string, string> = {
      number_id: numberId,
      provider_id: providerId,
    };

    // Only send operator_id if NOT "any"
    if (operatorId && operatorId !== 'any') {
      params.operator_id = operatorId;
    }

    const data = await apiGet('/v2/orders', params);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
