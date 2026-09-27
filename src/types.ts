export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  originalPrice: number;
  recordCount: string;
  fileFormat: string;
  fileSize: string;
  lastUpdated: string;
  badge?: string;
  description: string;
  highlights: string[];
  sampleColumns: string[];
  sampleRows: Record<string, string>[];
}

/** Public store information sent to every visitor. Never contains secrets. */
export interface StoreInfo {
  supportEmail: string;
  tokenExpiryHours: number;
  maxDownloadsPerToken: number;
  currency: string;
  razorpayKeyId: string;
  isConfigured: boolean;
  isLive: boolean;
  sandboxAllowed: boolean;
}

export interface DownloadLog {
  timestamp: string;
  ip: string;
  userAgent: string;
}

export interface EmailDeliveryLog {
  sentAt: string;
  recipient: string;
  status: 'delivered' | 'failed';
  subject: string;
}

export interface OrderRecord {
  orderId: string;
  token: string;
  productId: string;
  productTitle: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  downloadLogs: DownloadLog[];
  status: 'active' | 'expired' | 'revoked';
  /** Legacy field from the old simulated-email flow. Kept optional so older orders still load. */
  emailDeliveryLog?: EmailDeliveryLog[];
}

export type AccessStatus = 'active' | 'expired' | 'limit_reached' | 'revoked';

export interface AccessDetails {
  token: string;
  orderId: string;
  productTitle: string;
  productId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  paymentId: string;
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  downloadsRemaining: number;
  accessStatus: AccessStatus;
  fileFormat: string;
  fileSize: string;
  supportEmail: string;
}

/** Response of POST /api/verify-payment. */
export interface PaymentResult {
  success: boolean;
  message: string;
  token: string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  productTitle: string;
  orderId: string;
  paymentId: string;
  recipientEmail: string;
}

/** Store settings as shown to the admin. The Razorpay secret is never sent back. */
export interface AdminConfig {
  razorpayKeyId: string;
  razorpayKeySecretSet: boolean;
  masterDriveLink: string;
  tokenExpiryHours: number;
  maxDownloadsPerToken: number;
  supportEmail: string;
}

export interface AdminSummary {
  totalRevenue: number;
  totalOrders: number;
  totalDownloads: number;
  activeTokens: number;
  currency: string;
}
