import { PRODUCTS } from '@/data/products';
import type { AccessDetails, AccessStatus, Product, StoreInfo } from '@/types';
import { getRazorpayCredentials, isSandboxAllowed } from './razorpay';
import type { StoreConfig, StoredOrder } from './storage';

/**
 * Optional per-product Google Drive links, kept on the server only.
 * Products without an entry deliver the "Master Google Drive Link" from store settings,
 * so changing that setting in the dashboard takes effect for new purchases.
 */
const PRODUCT_DRIVE_LINKS: Record<string, string> = {
  // 'us-data': 'https://drive.google.com/drive/folders/...',
};

export function getProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(id: unknown): Product | undefined {
  return typeof id === 'string' ? PRODUCTS.find((p) => p.id === id) : undefined;
}

export function getDriveLinkFor(productId: string, config: StoreConfig): string {
  return PRODUCT_DRIVE_LINKS[productId] || config.masterDriveLink;
}

export function getStoreInfo(config: StoreConfig): StoreInfo {
  const creds = getRazorpayCredentials(config);
  return {
    supportEmail: config.supportEmail,
    tokenExpiryHours: config.tokenExpiryHours,
    maxDownloadsPerToken: config.maxDownloadsPerToken,
    currency: 'INR',
    razorpayKeyId: creds.keyId,
    isConfigured: creds.isConfigured,
    isLive: creds.isLive,
    sandboxAllowed: !creds.isConfigured && isSandboxAllowed(),
  };
}

export function getAccessStatus(order: StoredOrder): AccessStatus {
  if (order.status === 'revoked') return 'revoked';
  if (new Date(order.expiresAt).getTime() < Date.now()) return 'expired';
  if (order.downloadCount >= order.maxDownloads) return 'limit_reached';
  return 'active';
}

export function toAccessDetails(order: StoredOrder, config: StoreConfig): AccessDetails {
  const product = getProduct(order.productId);
  return {
    token: order.token,
    orderId: order.orderId,
    productTitle: order.productTitle,
    productId: order.productId,
    amount: order.amount,
    currency: order.currency,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    paymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    downloadCount: order.downloadCount,
    maxDownloads: order.maxDownloads,
    downloadsRemaining: Math.max(0, order.maxDownloads - order.downloadCount),
    accessStatus: getAccessStatus(order),
    fileFormat: product?.fileFormat || 'CSV/XLSX',
    fileSize: product?.fileSize || '150 MB',
    supportEmail: config.supportEmail,
  };
}
