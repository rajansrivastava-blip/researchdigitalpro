import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminLogin } from '@/components/AdminLogin';
import { isAdminConfigured, isAdminRequest } from '@/lib/server/auth';

export const metadata: Metadata = {
  title: 'Merchant dashboard',
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialTab = params.tab === 'settings' ? 'settings' : 'downloads';

  if (!(await isAdminRequest())) {
    return <AdminLogin isConfigured={isAdminConfigured()} />;
  }
  return <AdminDashboard key={initialTab} initialTab={initialTab} />;
}
