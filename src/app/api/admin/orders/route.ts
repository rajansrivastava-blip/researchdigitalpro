import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { loadConfig, loadOrders, toAdminConfig } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const orders = loadOrders();
  const now = Date.now();

  return NextResponse.json(
    {
      success: true,
      summary: {
        totalRevenue: orders.reduce((sum, o) => sum + (o.amount || 0), 0),
        totalOrders: orders.length,
        totalDownloads: orders.reduce((sum, o) => sum + (o.downloadCount || 0), 0),
        activeTokens: orders.filter((o) => o.status === 'active' && new Date(o.expiresAt).getTime() > now).length,
        currency: 'INR',
      },
      orders,
      config: toAdminConfig(loadConfig()),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
