import React, { useState, useEffect } from 'react';
import {
  Shield,
  Download,
  IndianRupee,
  Clock,
  Eye,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Ban,
  ArrowRight,
  HardDrive,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';
import { OrderRecord } from '../types.ts';

interface AdminDashboardProps {
  onClose: () => void;
  onOpenEmailPreview: (token: string) => void;
  initialTab?: 'downloads' | 'settings';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, 
  onOpenEmailPreview,
  initialTab = 'downloads',
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'settings'>(initialTab);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  } | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalDownloads: 0,
    activeTokens: 0,
    currency: 'INR',
  });
  const [config, setConfig] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: '',
    masterDriveLink: '',
    tokenExpiryHours: 24,
    maxDownloadsPerToken: 5,
    supportEmail: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderLogs, setSelectedOrderLogs] = useState<OrderRecord | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setSummary(data.summary || summary);
        setConfig(data.config || config);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving changes...');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveStatus('Settings updated successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err: any) {
      setSaveStatus(err.message || 'Error updating settings');
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
          keySecret: config.razorpayKeySecret,
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
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Network error while testing connection.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Research Dital Pro Merchant &amp; Download Control Center</h2>
              <p className="text-[11px] text-slate-400">
                Track customer downloads in real time, manage Razorpay credentials, and protect Drive assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Exit Console
            </button>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/60 divide-x divide-slate-800 text-xs">
          <div className="p-4">
            <span className="text-slate-400 block text-[11px] mb-0.5">Total Revenue</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">₹{summary.totalRevenue}</span>
              <span className="text-[10px] text-slate-500 font-mono">INR</span>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-white">Customer Transaction & Download Audits</h3>
                <p className="text-xs text-slate-400">
                  Every download is validated against a 24-hour cryptographic token and tracked with IP, timestamp, and user-agent.
                </p>
              </div>
              <button
                onClick={fetchAdminData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">No Orders Processed Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Once customers purchase datasets (US data for ₹79, others for ₹49, VIP bundle for ₹249), their transaction receipts and download tracking entries will appear here.
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
                        const isExpired = new Date(order.expiresAt).getTime() < Date.now();
                        const isRevoked = order.status === 'revoked';

                        return (
                          <tr key={order.token} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-white block">{order.customerName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{order.customerEmail}</span>
                              {order.customerPhone && (
                                <span className="text-[10px] text-slate-500 block font-mono">{order.customerPhone}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-200 block truncate max-w-[200px]">
                                {order.productTitle}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">ID: {order.productId}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">
                              ₹{order.amount} <span className="text-[10px] text-slate-400 font-normal">INR</span>
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
                              ) : (
                                <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Active (24h)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-100">{order.downloadCount}</span>
                              <span className="text-slate-500 text-[11px]"> / {order.maxDownloads}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                              {new Date(order.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              <span className="text-[10px] text-slate-500 block">
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
                                  onClick={() => onOpenEmailPreview(order.token)}
                                  title="View sent email"
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
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
                                    className="p-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors text-[10px]"
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <p className="text-[11px] text-slate-500 mt-1">
                    Provided link:{' '}
                    <code className="text-blue-400">
                      https://drive.google.com/drive/folders/1TBOQvwhuO3ob4UJ-JH-l0tvq8hnmXYec?usp=drive_link
                    </code>
                    . This URL is strictly hidden on the server and only delivered after verified payment.
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
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Production Gateway
                    </span>
                  ) : config.razorpayKeyId.startsWith('rzp_test_') ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Test / Sandbox Mode
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
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
                    <span className="text-[10px] text-slate-500">Starts with rzp_live_ (Real) or rzp_test_ (Test)</span>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Razorpay Key Secret <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={config.razorpayKeySecret}
                      onChange={(e) => setConfig({ ...config, razorpayKeySecret: e.target.value.trim() })}
                      placeholder="Enter Key Secret"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500">Used for cryptographic payment signature verification</span>
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

                <p className="text-[11px] text-slate-500 leading-relaxed">
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
                      <strong className="text-white">Website Details:</strong> In your Razorpay Dashboard under <strong className="text-white">Account &amp; Settings &gt; Website details</strong>, ensure your store URL is listed: <code className="text-emerald-400 font-mono text-[10px] break-all">{window.location.origin}</code>.
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
                    <span className="text-[10px] text-slate-500">Default: 24 hours per user specification</span>
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
                    <span className="text-[10px] text-slate-500">Limits abuse and unauthorized re-sharing</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  {saveStatus && (
                    <span className="text-emerald-400 flex items-center gap-1.5 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {saveStatus}
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
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs text-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm">Download Tracking Activity Log</h4>
                <button
                  onClick={() => setSelectedOrderLogs(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Customer: </span>
                <span className="font-semibold text-white">{selectedOrderLogs.customerName} ({selectedOrderLogs.customerEmail})</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Product: </span>
                <span className="text-blue-300">{selectedOrderLogs.productTitle}</span>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 p-3 max-h-56 overflow-y-auto space-y-2">
                {selectedOrderLogs.downloadLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No download attempts recorded yet for this pass.</p>
                ) : (
                  selectedOrderLogs.downloadLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                      <div className="flex justify-between font-mono text-[11px] text-slate-300">
                        <span>IP: {log.ip}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{log.userAgent}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    handleTokenAction(selectedOrderLogs.token, 'extend_24h');
                    setSelectedOrderLogs(null);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs font-medium"
                >
                  Extend +24 Hours
                </button>
                <button
                  onClick={() => setSelectedOrderLogs(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
