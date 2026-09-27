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

export interface StoreInfo {
  supportEmail: string;
  tokenExpiryHours: number;
  currency: string;
  razorpayKeyId: string;
  isDemoMode: boolean;
}

export interface DownloadLog {
  timestamp: string;
  ip: string;
  userAgent: string;
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
  emailDeliveryLog: {
    sentAt: string;
    recipient: string;
    status: 'delivered' | 'failed';
    subject: string;
  }[];
}

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
  accessStatus: 'active' | 'expired' | 'limit_reached' | 'revoked';
  fileFormat: string;
  fileSize: string;
  supportEmail: string;
}
