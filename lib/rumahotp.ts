const BASE_URL = 'https://www.rumahotp.io/api';
const API_KEY = process.env.RUMAHOTP_API_KEY!;

function buildUrl(path: string, params: Record<string, string | number> = {}): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function apiGet(path: string, params: Record<string, string | number> = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RumahOTP API error: ${res.status}`);
  return res.json();
}

// Markup logic
export function applyMarkup(price: number): number {
  return price <= 15000 ? price + 500 : price + 1000;
}
