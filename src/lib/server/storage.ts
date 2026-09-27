import fs from 'fs';
import path from 'path';
import type { AdminConfig, OrderRecord } from '@/types';
import { DEFAULT_SUPPORT_EMAIL } from '@/lib/constants';

/**
 * File-based persistence in ./data (or DATA_DIR).
 * Every read goes to disk so all route handlers see the same state. Reads and writes are
 * synchronous, so a read-modify-write cycle cannot interleave with another request.
 * Note: this needs a persistent filesystem. It will not keep data on serverless hosts.
 */
const DATA_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data')
);
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

export interface StoreConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  masterDriveLink: string;
  tokenExpiryHours: number;
  maxDownloadsPerToken: number;
  supportEmail: string;
}

/** Server-only order shape: includes the hidden Drive link. */
export interface StoredOrder extends OrderRecord {
  hiddenTargetLink: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch (e) {
    console.error(`Error reading ${path.basename(file)}:`, e);
  }
  return fallback;
}

function writeJson(file: string, data: unknown) {
  ensureDataDir();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

function defaultConfig(): StoreConfig {
  return {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    // Never hard-code the Drive link: this repository is public. Set MASTER_DRIVE_LINK or save it in /admin.
    masterDriveLink: process.env.MASTER_DRIVE_LINK || '',
    tokenExpiryHours: 24,
    maxDownloadsPerToken: 5,
    supportEmail: process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL,
  };
}

export function loadConfig(): StoreConfig {
  return { ...defaultConfig(), ...readJson<Partial<StoreConfig>>(CONFIG_FILE, {}) };
}

export function saveConfig(config: StoreConfig) {
  writeJson(CONFIG_FILE, config);
}

/** Config safe to send to an authenticated admin: the secret is replaced by a flag. */
export function toAdminConfig(config: StoreConfig): AdminConfig {
  const { razorpayKeySecret, ...rest } = config;
  return { ...rest, razorpayKeySecretSet: razorpayKeySecret.trim().length > 0 };
}

export function loadOrders(): StoredOrder[] {
  const orders = readJson<StoredOrder[]>(ORDERS_FILE, []);
  return Array.isArray(orders) ? orders : [];
}

export function saveOrders(orders: StoredOrder[]) {
  writeJson(ORDERS_FILE, orders);
}

export function findOrderByToken(token: string): StoredOrder | undefined {
  return loadOrders().find((o) => o.token === token);
}

/** Loads orders, applies `mutate` to the matching order, saves, and returns it. */
export function updateOrder(token: string, mutate: (order: StoredOrder) => void): StoredOrder | undefined {
  const orders = loadOrders();
  const order = orders.find((o) => o.token === token);
  if (!order) return undefined;
  mutate(order);
  saveOrders(orders);
  return order;
}

export function findOrderByPayment(paymentId: string): StoredOrder | undefined {
  return loadOrders().find((o) => o.razorpayPaymentId === paymentId);
}

/**
 * Adds the order unless one already exists for the same Razorpay payment ID.
 * The check and the write happen in one synchronous step, so the browser callback and the
 * webhook can never both create a pass for the same payment.
 */
export function addOrderIfNewPayment(order: StoredOrder): { order: StoredOrder; created: boolean } {
  const orders = loadOrders();
  const existing = orders.find((o) => o.razorpayPaymentId === order.razorpayPaymentId);
  if (existing) return { order: existing, created: false };
  orders.unshift(order);
  saveOrders(orders);
  return { order, created: true };
}
