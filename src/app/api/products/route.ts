import { NextResponse } from 'next/server';
import { getProducts, getStoreInfo } from '@/lib/server/catalog';
import { loadConfig } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    success: true,
    products: getProducts(),
    storeInfo: getStoreInfo(loadConfig()),
  });
}
