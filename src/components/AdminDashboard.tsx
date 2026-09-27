'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Clock,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Ban,
  HardDrive,
  KeyRound,
  FileSpreadsheet,
  LogOut,
  Activity,
  Download,
} from 'lucide-react';
import type { AdminConfig, AdminSummary, OrderRecord } from '@/types';
import { useAppUI } from './AppProviders';
import { BRAND_NAME } from '@/lib/constants';
import { useOrigin } from '@/lib/useOrigin';
import { ModalShell } from './ui/ModalShell';

type AdminLoadResult =
  | { kind: 'ok'; data: { orders?: OrderRecord[]; summary?: AdminSummary; config?: AdminConfig } }
  | { kind: 'unauthorized' }
  | { kind: 'error'; message: string };

/** Fetches dashboard data without touching React state (so it can run from an effect). */
async function loadAdminData(): Promise<AdminLoadResult> {
  try {
    const res = await fetch('/api/admin/orders', { cache: 'no-store' });
    if (res.status === 401) return { kind: 'unauthorized' };
    const data = await res.json();
    if (!res.ok) return { kind: 'error', message: data.error || 'Failed to load dashboard data.' };
    return { kind: 'ok', data };
  } catch (e) {
    console.error('Failed to load admin data:', e);
    return { kind: 'error', message: e instanceof Error ? e.message : 'Failed to load dashboard data.' };
  }
}

interface AdminDashboardProps {
  initialTab?: 'downloads' | 'settings';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'downloads' }) => {
  const router = useRouter();
  const { openReceipt } = useAppUI();
  const origin = useOrigin();
  const [activeTab, setActiveTab] = useState<'downloads' | 'settings'>(initialTab);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  } | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [summary, setSummary] = useState<AdminSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    totalDownloads: 0,
    activeTokens: 0,
    currency: 'INR',
  });
  const [config, setConfig] = useState<AdminConfig>({
    razorpayKeyId: '',
    razorpayKeySecretSet: false,
    masterDriveLink: '',
    tokenExpiryHours: 24,
    maxDownloadsPerToken: 5,
    supportEmail: '',
  });
  // The saved secret is never sent to the browser. This holds a newly typed one only.
  const [newKeySecret, setNewKeySecret] = useState('');
  // Timestamp used to classify passes as expired. Updated on every data load (keeps render pure).
  const [now, setNow] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOrderLogs, setSelectedOrderLogs] = useState<OrderRecord | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const applyAdminData = useCallback(
    (result: AdminLoadResult) => {
      if (result.kind === 'unauthorized') {
        router.refresh(); // Session expired: the page re-renders the login form.
        return;
      }
      if (result.kind === 'error') {
        setLoadError(result.message);
      } else {
        setOrders(result.data.orders || []);
        setNow(Date.now());
        if (result.data.summary) setSummary(result.data.summary);
        if (result.data.config) setConfig(result.data.config);
        setLoadError(null);
      }
      setIsLoading(false);
    },
    [router]
  );

  const fetchAdminData = useCallback(async () => applyAdminData(await loadAdminData()), [applyAdminData]);

  // Initial load. State is only applied once the request settles, and not at all after unmount.
  useEffect(() => {
    let cancelled = false;
    loadAdminData().then((result) => {
      if (!cancelled) applyAdminData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applyAdminData]);

  const reloadAdminData = () => {
    setIsLoading(true);
    fetchAdminData();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
    router.refresh();
  };

  const handleTokenAction = async (token: string, action: 'revoke' | 'extend_24h' | 'reset_downloads') => {
    try {
      const res = await fetch('/api/admin/token-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error('Token action failed:', e);
    }
  };

  const handleSaveConfig = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus({ ok: true, message: 'Saving changes...' });
    try {
      const { razorpayKeySecretSet: _ignored, ...editable } = config;
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editable, razorpayKeySecret: newKeySecret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error updating settings');
      if (data.config) setConfig(data.config);
      setNewKeySecret('');
      setSaveStatus({ ok: true, message: 'Settings updated successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus({ ok: false, message: err instanceof Error ? err.message : 'Error updating settings' });
    }
  };

  const handleTestRazorpay = async () => {
    setTestStatus({ loading: true });
    try {
      const res = await fetch('/api/admin/test-razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: config.razorpayKeyId,
          keySecret: newKeySecret, // blank = test with the saved secret
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus({
          loading: false,
          success: true,
          message: data.message,
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: data.error || 'Connection test failed.',
        });
      }
    } catch (err) {
      setTestStatus({
        loading: false,
        success: false,
        message: err instanceof Error ? err.message : 'Network error while testing connection.',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="relative w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">{BRAND_NAME} · Merchant dashboard</h1>
              <p className="text-[11px] text-slate-400">
                Track customer downloads in real time, manage Razorpay credentials, and protect Drive assets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab switch */}
            <div className="flex items-center p-1 bg-slate-800/80 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('downloads')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'downloads' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Download Tracking ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gateways & Drive Settings
              </button>
            </div>

            <Link
              href="/"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Exit Console
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out of the merchant dashboard"
              className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {loadError && (
          <div className="px-6 py-3 border-b border-red-900/50 bg-red-950/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{loadError}</span>
            <button onClick={reloadAdminData} className="px-2.5 py-1 rounded-md bg-red-900/50 hover:bg-red-900 text-red-100 font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-800 bg-slate-900/60 divide-x divide-slate-800 text-xs">
          <div className="p-4">
            <span className="text-slate-400 block text-[11px] mb-0.5">Total Revenue</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">₹{summary.totalRevenue}</span>
              <span className="text-[11px] text-slate-400 font-mono">INR</span>
            </div>
          </div>
          <div className="p-4">
            <span className="text-slate-400 block text-[11px] mb-0.5">Orders Processed</span>
            <span className="text-lg font-bold text-white">{summary.totalOrders}</span>
          </div>
          <div className="p-4">
            <span className="text-slate-400 block text-[11px] mb-0.5">Customer Downloads</span>
            <span className="text-lg font-bold text-blue-400">{summary.totalDownloads}</span>
          </div>
          <div className="p-4">
            <span className="text-slate-400 block text-[11px] mb-0.5">Active Time-Limited Passes</span>
            <span className="text-lg font-bold text-emerald-400">{summary.activeTokens}</span>
          </div>
        </div>

        {/* Tab 1: Download Tracking Logs */}
        {activeTab === 'downloads' && (
          <div className="flex-1 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-bold text-white">Customer Transaction & Download Audits</h3>
                <p className="text-xs text-slate-400">
                  Every download is validated against a 24-hour cryptographic token and tracked with IP, timestamp, and user-agent.
                </p>
              </div>
              <button
                onClick={reloadAdminData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">No Orders Processed Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  When customers buy a dataset, their orders and download activity will appear here.
                </p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Dataset Purchased</th>
                        <th className="py-3 px-4">Amount Paid</th>
                        <th className="py-3 px-4">Pass Status</th>
                        <th className="py-3 px-4">Downloads Used</th>
                        <th className="py-3 px-4">Token Expiration</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {orders.map((order) => {
                        const isExpired = new Date(order.expiresAt).getTime() < now;
                        const isRevoked = order.status === 'revoked';
                        const isLimitReached = order.downloadCount >= order.maxDownloads;

                        return (
                          <tr key={order.token} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-white block">{order.customerName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{order.customerEmail}</span>
                              {order.customerPhone && (
                                <span className="text-[11px] text-slate-400 block font-mono">{order.customerPhone}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-200 block truncate max-w-[200px]">
                                {order.productTitle}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">ID: {order.productId}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">
                              ₹{order.amount} <span className="text-[11px] text-slate-400 font-normal">INR</span>
                            </td>
                            <td className="py-3 px-4">
                              {isRevoked ? (
                                <span className="text-red-400 font-semibold text-[11px] flex items-center gap-1">
                                  <Ban className="w-3 h-3" /> Revoked
                                </span>
                              ) : isExpired ? (
                                <span className="text-amber-400 font-medium text-[11px] flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Expired
                                </span>
                              ) : isLimitReached ? (
                                <span className="text-amber-400 font-medium text-[11px] flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Limit Reached
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-100">{order.downloadCount}</span>
                              <span className="text-slate-400 text-[11px]"> / {order.maxDownloads}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                              {new Date(order.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              <span className="text-[11px] text-slate-400 block">
                                {new Date(order.expiresAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedOrderLogs(order)}
                                  title="View IP audit logs"
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openReceipt(order.token)}
                                  title="View receipt"
                                  aria-label={`View receipt for ${order.customerEmail}`}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                {isLimitReached && !isRevoked && (
                                  <button
                                    onClick={() => handleTokenAction(order.token, 'reset_downloads')}
                                    title="Reset download counter to 0"
                                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!isRevoked ? (
                                  <button
                                    onClick={() => handleTokenAction(order.token, 'revoke')}
                                    title="Revoke download link immediately"
                                    className="p-1.5 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 transition-colors"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleTokenAction(order.token, 'extend_24h')}
                                    title="Restore & Extend by 24 Hours"
                                    className="p-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors text-[11px]"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Settings & Secret Storage Configuration */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 space-y-6">
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-white mb-1">Store Gateway & Drive Security Settings</h3>
              <p className="text-xs text-slate-400">
                Configure your Google Drive storage folder and Razorpay gateway credentials. Real drive links are kept hidden from public clients.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="max-w-2xl space-y-5 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>Hidden Google Drive Repository URL</span>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Master Google Drive Link</label>
                  <input
                    type="url"
                    required
                    value={config.masterDriveLink}
                    onChange={(e) => setConfig({ ...config, masterDriveLink: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Delivered to every new purchase. This URL is strictly hidden on the server and only delivered after verified
                    payment. Passes issued earlier keep the link they were issued with.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Razorpay Payment Gateway API Keys</span>
                  </div>
                  {config.razorpayKeyId.startsWith('rzp_live_') ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Production Gateway
                    </span>
                  ) : config.razorpayKeyId.startsWith('rzp_test_') ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Test / Sandbox Mode
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-medium">
                      Setup Pending (Awaiting Keys)
                    </span>
                  )}
                </div>

                {/* Step-by-Step Instructions Box */}
                <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-300">How to get your API Keys from Razorpay:</span>
                    <a
                      href="https://dashboard.razorpay.com/app/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <span>Open Razorpay API Keys</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside text-slate-400 text-[11px] space-y-1 leading-relaxed">
                    <li>Log into your Razorpay account at <strong className="text-slate-300 font-mono">dashboard.razorpay.com</strong>.</li>
                    <li>In the left sidebar, click <strong className="text-slate-300">Account &amp; Settings</strong> &gt; <strong className="text-slate-300">API Keys</strong>.</li>
                    <li>Click <strong className="text-slate-300">Generate Key</strong> (or copy your existing Key ID and Key Secret).</li>
                    <li>Paste your <code className="text-emerald-400 font-mono">Key ID</code> and <code className="text-emerald-400 font-mono">Key Secret</code> below.</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Razorpay Key ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.razorpayKeyId}
                      onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value.trim() })}
                      placeholder="rzp_live_... or rzp_test_..."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] text-slate-400">Starts with rzp_live_ (Real) or rzp_test_ (Test)</span>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Razorpay Key Secret <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={newKeySecret}
                      onChange={(e) => setNewKeySecret(e.target.value.trim())}
                      placeholder={config.razorpayKeySecretSet ? '•••••••• saved (leave blank to keep)' : 'Enter Key Secret'}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] text-slate-400">
                      {config.razorpayKeySecretSet
                        ? 'A secret is saved on the server. It is never shown again.'
                        : 'Used for cryptographic payment signature verification'}
                    </span>
                  </div>
                </div>

                {/* Test Connection Button & Status */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={handleTestRazorpay}
                    disabled={testStatus?.loading || !config.razorpayKeyId}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                  >
                    {testStatus?.loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying with Razorpay API...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Test Razorpay Connection</span>
                      </>
                    )}
                  </button>

                  {testStatus && (
                    <div
                      className={`text-xs flex items-center gap-1.5 ${
                        testStatus.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {testStatus.success ? (
                        <CheckCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  All customer payments via UPI (GPay, PhonePe, Paytm), NetBanking, and Cards will be processed through Razorpay and settled directly to your connected bank account.
                </p>

                {/* Diagnostic box for 'issue with the merchant' error */}
                <div className="p-3.5 rounded-lg bg-amber-950/25 border border-amber-800/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Resolving &quot;This payment has failed due to an issue with the merchant&quot;:</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1.5 leading-relaxed">
                    <li>
                      <strong className="text-white">Account Activation &amp; KYC:</strong> Razorpay creates Live API keys, but blocks customer checkout if your account activation is pending review. Check the top banner at <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">dashboard.razorpay.com</a> to complete KYC verification.
                    </li>
                    <li>
                      <strong className="text-white">Website Details:</strong> In your Razorpay Dashboard under <strong className="text-white">Account &amp; Settings &gt; Website details</strong>, ensure your store URL is listed: <code className="text-emerald-400 font-mono text-[11px] wrap-anywhere">{origin}</code>.
                    </li>
                    <li>
                      <strong className="text-white">Instant Testing:</strong> You can switch the toggle at the top of your Razorpay Dashboard to <strong className="text-amber-300">Test Mode</strong>, generate a <code className="text-amber-300 font-mono">rzp_test_...</code> key pair, and paste it here to test the full checkout flow right away!
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Security & Download Restrictions</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Token Expiry Window (Hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={config.tokenExpiryHours}
                      onChange={(e) => setConfig({ ...config, tokenExpiryHours: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] text-slate-400">Default: 24 hours per user specification</span>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Max Download Limit Per Token</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={config.maxDownloadsPerToken}
                      onChange={(e) => setConfig({ ...config, maxDownloadsPerToken: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] text-slate-400">Limits abuse and unauthorized re-sharing</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  {saveStatus && (
                    <span
                      className={`flex items-center gap-1.5 text-xs ${saveStatus.ok ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {saveStatus.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {saveStatus.message}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-xs"
                >
                  Save Store Configurations
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Detailed IP Audit Modal for a specific order */}
        {selectedOrderLogs && (
          <ModalShell
            onClose={() => setSelectedOrderLogs(null)}
            accent="amber"
            size="md"
            icon={<Activity className="w-5 h-5" />}
            eyebrow="Audit trail"
            title="Download activity"
            subtitle={
              <>
                {selectedOrderLogs.downloadCount} of {selectedOrderLogs.maxDownloads} downloads used
              </>
            }
            footer={
              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setSelectedOrderLogs(null)}
                  className="px-4 py-2 rounded-xl ring-1 ring-slate-700 hover:bg-white/5 text-slate-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleTokenAction(selectedOrderLogs.token, 'extend_24h');
                    setSelectedOrderLogs(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-600/20"
                >
                  Extend +24 hours
                </button>
              </div>
            }
          >
            <div className="space-y-4 text-xs text-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-900/60 ring-1 ring-slate-800">
                  <span className="block text-[11px] font-mono uppercase tracking-widest text-slate-400">Customer</span>
                  <span className="block mt-0.5 font-semibold text-white truncate">{selectedOrderLogs.customerName}</span>
                  <span className="block text-[11px] font-mono text-slate-400 truncate">{selectedOrderLogs.customerEmail}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 ring-1 ring-slate-800">
                  <span className="block text-[11px] font-mono uppercase tracking-widest text-slate-400">Product</span>
                  <span className="block mt-0.5 text-blue-300 font-medium leading-snug">{selectedOrderLogs.productTitle}</span>
                </div>
              </div>

              {selectedOrderLogs.downloadLogs.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed border-slate-800 text-slate-400">
                  No download attempts recorded yet for this pass.
                </div>
              ) : (
                <ol className="relative space-y-3 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                  {[...selectedOrderLogs.downloadLogs].reverse().map((log, idx) => (
                    <li key={`${log.timestamp}-${idx}`} className="relative pl-9">
                      <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-amber-500/15 ring-1 ring-amber-400/40 ring-offset-2 ring-offset-slate-950 flex items-center justify-center">
                        <Download className="w-3 h-3 text-amber-300" />
                      </span>
                      <div className="p-3 rounded-xl bg-slate-900/60 ring-1 ring-slate-800 space-y-1">
                        <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px]">
                          <span className="text-slate-200">IP {log.ip}</span>
                          <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate" title={log.userAgent}>
                          {log.userAgent}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </ModalShell>
        )}
      </div>
    </div>
  );
};
