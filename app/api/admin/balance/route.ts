import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/rumahotp';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.uid !== process.env.ADMIN_UID) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    const data = await apiGet('/v1/user/balance');
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
