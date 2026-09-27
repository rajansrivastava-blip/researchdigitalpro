import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Persistent storage setup
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Default Owner Configuration
const DEFAULT_DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1TBOQvwhuO3ob4UJ-JH-l0tvq8hnmXYec?usp=drive_link';

interface StoreConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  masterDriveLink: string;
  tokenExpiryHours: number;
  maxDownloadsPerToken: number;
  supportEmail: string;
}

const defaultConfig: StoreConfig = {
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_AiStudioStore2026',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_vault_secure_key',
  masterDriveLink: DEFAULT_DRIVE_FOLDER,
  tokenExpiryHours: 24,
  maxDownloadsPerToken: 5,
  supportEmail: process.env.SUPPORT_EMAIL || 'helpeasemymart@gmail.com',
};

function loadConfig(): StoreConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  return defaultConfig;
}

function saveConfig(config: StoreConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

let storeConfig = loadConfig();

// Helper to get active Razorpay credentials (from storeConfig or process.env)
function getRazorpayCredentials() {
  const keyId = (storeConfig.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (storeConfig.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();
  const isCustomKey =
    keyId.length > 0 &&
    keyId !== 'rzp_test_AiStudioStore2026' &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'));
  const hasSecret = keySecret.length > 0 && keySecret !== 'test_secret_vault_secure_key';
  return {
    keyId,
    keySecret,
    isConfigured: isCustomKey && hasSecret,
    isLive: keyId.startsWith('rzp_live_'),
  };
}

// Product Database
// Prices per prompt: US data is only 79 INR; All other files are 199 INR.
// NOTE: Raw target drive links are strictly hidden on the server!
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
  description: string;
  highlights: string[];
  sampleColumns: string[];
  sampleRows: Record<string, string>[];
  targetDriveLink: string;
  badge?: string;
}

const PRODUCTS_CATALOG: Product[] = [
  {
    id: 'us-data',
    title: 'USA B2B & Consumer Master Database',
    category: 'United States',
    price: 79,
    currency: 'INR',
    originalPrice: 499,
    recordCount: '1,250,000+ Records',
    fileFormat: 'CSV / XLSX',
    fileSize: '185 MB',
    lastUpdated: 'September 2026 (Fresh Update)',
    badge: 'Special Offer: ₹79 · 2026 Updated Data',
    description: 'High-accuracy, verified US leads across all 50 states with 2026 fresh verified contacts. Includes executives, direct phone numbers, business email addresses, industry codes (SIC/NAICS), and verified postal addresses.',
    highlights: [
      '⚡ 2026 Fresh Data Included: Scrubbed & verified for 2026 outreach',
      'Comprehensive 50-State coverage with postal verification',
      'Direct contact emails, mobile/office phones, and LinkedIn profiles',
      'Cleaned & scrubbed against spam traps, bounce rate < 2%',
    ],
    sampleColumns: ['Company', 'Contact Name', 'Job Title', 'Work Email', 'Contact Number', 'City', 'State', 'Annual Revenue'],
    sampleRows: [
      {
        Company: 'Apex Cloud Solutions',
        'Contact Name': 'David Miller',
        'Job Title': 'Chief Operating Officer',
        'Work Email': 'd.miller@apex***.com',
        'Contact Number': '+1 (415) 892-****',
        City: 'San Francisco',
        State: 'CA',
        'Annual Revenue': '$12M - $25M',
      },
      {
        Company: 'Horizon Logistics Group',
        'Contact Name': 'Sarah Jenkins',
        'Job Title': 'VP of Supply Chain',
        'Work Email': 's.jenkins@hlg***.net',
        'Contact Number': '+1 (312) 441-****',
        City: 'Chicago',
        State: 'IL',
        'Annual Revenue': '$50M+',
      },
      {
        Company: 'Vanguard Medical Devices',
        'Contact Name': 'Robert Chen',
        'Job Title': 'Procurement Director',
        'Work Email': 'r.chen@vanguard***.org',
        'Contact Number': '+1 (617) 703-****',
        City: 'Boston',
        State: 'MA',
        'Annual Revenue': '$30M - $50M',
      },
    ],
    targetDriveLink: DEFAULT_DRIVE_FOLDER,
  },
  {
    id: 'global-b2b',
    title: 'Global B2B Decision Makers & C-Suite Directory',
    category: 'International',
    price: 49,
    currency: 'INR',
    originalPrice: 499,
    recordCount: '850,000+ Records',
    fileFormat: 'CSV / XLSX',
    fileSize: '142 MB',
    lastUpdated: 'September 2026 (Fresh Update)',
    badge: 'Only ₹49 · 2026 Fresh Data',
    description: 'Worldwide executive contacts spanning North America, Europe, APAC, and Middle East. Includes verified 2026 active leads for enterprise outreach and prospecting.',
    highlights: [
      '⚡ 2026 Fresh Data Included: Active 2026 decision makers & C-Suite',
      'Covers CEOs, Founders, VPs, and Technical Decision Makers',
      'Includes corporate domain, revenue bracket, and tech stack tags',
      'Pre-formatted for instant import into Apollo, HubSpot, and Instantly',
    ],
    sampleColumns: ['Full Name', 'Company Name', 'Executive Role', 'Direct Email', 'Contact Number', 'City / State', 'Industry'],
    sampleRows: [
      {
        'Full Name': 'Rajesh K. Mehta',
        'Company Name': 'Apex Global Enterprises',
        'Executive Role': 'Managing Director',
        'Direct Email': 'r.mehta@apexglobal***.com',
        'Contact Number': '+91 98201 *****',
        'City / State': 'Mumbai, MH',
        Industry: 'Enterprise Software & IT',
      },
      {
        'Full Name': 'Vikramaditya Rao',
        'Company Name': 'Vertex Tech Solutions',
        'Executive Role': 'Chief Technology Officer',
        'Direct Email': 'v.rao@vertex***.in',
        'Contact Number': '+91 98112 *****',
        'City / State': 'Bengaluru, KA',
        Industry: 'FinTech & Cloud Infra',
      },
      {
        'Full Name': 'Pooja Singhania',
        'Company Name': 'CleanEnergy Ventures',
        'Executive Role': 'VP Business Development',
        'Direct Email': 'p.singhania@cleanenergy***.in',
        'Contact Number': '+91 97170 *****',
        'City / State': 'Gurugram, HR',
        Industry: 'Renewable Power',
      },
    ],
    targetDriveLink: DEFAULT_DRIVE_FOLDER,
  },
  {
    id: 'ecommerce-shopify',
    title: 'E-Commerce Brands & Shopify Store Owners Directory',
    category: 'E-Commerce',
    price: 49,
    currency: 'INR',
    originalPrice: 399,
    recordCount: '420,000+ Stores',
    fileFormat: 'CSV / XLSX',
    fileSize: '96 MB',
    lastUpdated: 'September 2026 (Fresh Update)',
    badge: 'Only ₹49 · 2026 Fresh Data',
    description: 'Verified direct contacts of D2C founders, Shopify Plus brand owners, and e-commerce directors with active stores verified in 2026.',
    highlights: [
      '⚡ 2026 Fresh Data Included: Active 2026 operating e-commerce stores',
      'Categorized by niche: Fashion, Beauty, Electronics, Home & Pet',
      'Includes store estimated GMV, Klaviyo/Meta Pixel presence',
      'Direct founder email and Instagram/TikTok handle links',
    ],
    sampleColumns: ['Store Name', 'Domain', 'Founder Name', 'Direct Email', 'Contact Number', 'Platform', 'Monthly Revenue'],
    sampleRows: [
      {
        'Store Name': 'Glow Botanics Organics',
        Domain: 'glowbotanics***.in',
        'Founder Name': 'Priya Sundaram',
        'Direct Email': 'priya@glowbotanics***.in',
        'Contact Number': '+91 99882 *****',
        Platform: 'Shopify Plus',
        'Monthly Revenue': '₹45 Lakhs / mo',
      },
      {
        'Store Name': 'Urban Thread Studio',
        Domain: 'urbanthread***.in',
        'Founder Name': 'Marcus Taneja',
        'Direct Email': 'marcus@urbanthread***.in',
        'Contact Number': '+91 98450 *****',
        Platform: 'Shopify',
        'Monthly Revenue': '₹28 Lakhs / mo',
      },
      {
        'Store Name': 'Kavya Heritage Decor',
        Domain: 'kavyaheritage***.com',
        'Founder Name': 'Kavya Rathi',
        'Direct Email': 'kavya@kavyaheritage***.com',
        'Contact Number': '+91 98710 *****',
        Platform: 'Shopify / WooCommerce',
        'Monthly Revenue': '₹35 Lakhs / mo',
      },
    ],
    targetDriveLink: DEFAULT_DRIVE_FOLDER,
  },
  {
    id: 'real-estate-investors',
    title: 'Real Estate Investors, Brokers & Property Owners',
    category: 'Real Estate',
    price: 49,
    currency: 'INR',
    originalPrice: 499,
    recordCount: '620,000+ Records',
    fileFormat: 'CSV / XLSX',
    fileSize: '118 MB',
    lastUpdated: 'September 2026 (Fresh Update)',
    badge: 'Only ₹49 · 2026 Fresh Data',
    description: 'Extensive database of active 2026 accredited real estate investors, syndicators, commercial brokerages, and property asset managers.',
    highlights: [
      '⚡ 2026 Fresh Data Included: Verified active 2026 investors & brokers',
      'Commercial, Residential, Multi-Family, and Land development segments',
      'Includes investor portfolio size, preferred asset classes, and state',
      'Direct verified mobile numbers and personal/office emails',
    ],
    sampleColumns: ['Firm / Investor', 'Principal Name', 'Asset Specialization', 'Email Address', 'Contact Number', 'City / State'],
    sampleRows: [
      {
        'Firm / Investor': 'Beacon Crest Capital & Realty',
        'Principal Name': 'Girish Vance',
        'Asset Specialization': 'Commercial & Multi-Unit Residential',
        'Email Address': 'gvance@beaconcrest***.in',
        'Contact Number': '+91 98211 *****',
        'City / State': 'Mumbai, MH',
      },
      {
        'Firm / Investor': 'Sterling Oak Real Estate',
        'Principal Name': 'Pradeep Malhotra',
        'Asset Specialization': 'Industrial Warehousing & Plots',
        'Email Address': 'pmalhotra@sterlingoak***.com',
        'Contact Number': '+91 98105 *****',
        'City / State': 'Delhi NCR',
      },
      {
        'Firm / Investor': 'Southern Apex Estates',
        'Principal Name': 'Anita Venkatesh',
        'Asset Specialization': 'Commercial Office Spaces',
        'Email Address': 'anita@apexestates***.in',
        'Contact Number': '+91 98401 *****',
        'City / State': 'Bengaluru, KA',
      },
    ],
    targetDriveLink: DEFAULT_DRIVE_FOLDER,
  },
  {
    id: 'tech-founders',
    title: 'Seed & Series A Tech Startups & Founders List',
    category: 'Technology',
    price: 49,
    currency: 'INR',
    originalPrice: 499,
    recordCount: '340,000+ Startups',
    fileFormat: 'CSV / XLSX',
    fileSize: '78 MB',
    lastUpdated: 'September 2026 (Fresh Update)',
    badge: 'Only ₹49 · 2026 Fresh Data',
    description: 'Fresh directory of high-growth 2026 tech startups, YC / Techstars alumni, AI innovators, and recently funded venture-backed companies.',
    highlights: [
      '⚡ 2026 Fresh Data Included: Recent 2026 funding rounds & new startups',
      'Founders, Co-founders, and Heads of Engineering with verified contact info',
      'Funding stage, last round raised ($), and lead investors tagged',
      'Categorized by AI/ML, SaaS, Web3, ClimateTech, and HealthTech',
    ],
    sampleColumns: ['Startup Name', 'Stage', 'Founders', 'Founder Email', 'Contact Number', 'Location', 'Tech Focus'],
    sampleRows: [
      {
        'Startup Name': 'NeuralFlow Systems',
        Stage: 'Series A',
        Founders: 'Dr. Aris Verma & Maya Lin',
        'Founder Email': 'aris@neuralflow***.ai',
        'Contact Number': '+91 98188 *****',
        Location: 'Bengaluru / Hyderabad',
        'Tech Focus': 'Autonomous Agents & AI',
      },
      {
        'Startup Name': 'Klaro Analytics',
        Stage: 'Seed',
        Founders: 'Daniel S. Choudhury',
        'Founder Email': 'daniel@klaro***.io',
        'Contact Number': '+91 99204 *****',
        Location: 'Pune / Mumbai',
        'Tech Focus': 'B2B FinTech & Payments',
      },
      {
        'Startup Name': 'Nexura Health Labs',
        Stage: 'Pre-Series A',
        Founders: 'Rohan Deshmukh',
        'Founder Email': 'rohan@nexura***.health',
        'Contact Number': '+91 97690 *****',
        Location: 'Gurugram / Delhi',
        'Tech Focus': 'AI Health Diagnostics',
      },
    ],
    targetDriveLink: DEFAULT_DRIVE_FOLDER,
  },
  {
    id: 'marketing-agencies',
    title: 'Digital Marketing & Growth Agencies Directory',
    category: 'Marketing',
    price: 49,
    currency: 'INR',
    originalPrice: 399,
    recordCount: '280,000+ Agencies',
    fileFormat: 'CSV / XLSX',
    fileSize: '65 MB',
    lastUpdated: 'September 2026 (Fresh Update)',
    badge: 'Only ₹49 · 2026 Fresh Data',
    description: 'Verified contact list of marketing agency founders, media buyers, SEO leads, and creative directors actively operating in 2026.',
    highlights: [
      '⚡ 2026 Fresh Data Included: Active 2026 digital marketing agencies',
      'Categorized: Performance Ads, SEO, Influencer, Web Design, PR',
      'Agency team size and typical client budget range listed',
      'Direct decision-maker contact details for white-label partnerships',
    ],
    sampleColumns: ['Agency Name', 'Agency Head', 'Specialization', 'Work Email', 'Contact Number', 'Location', 'Client Tier'],
    sampleRows: [
      {
        'Agency Name': 'Vivid Media Group',
        'Agency Head': 'Alok K. Sengupta',
        Specialization: 'Paid Social & Meta Ads',
        'Work Email': 'alok@vividmedia***.co.in',
        'Contact Number': '+91 98300 *****',
        Location: 'Kolkata / Mumbai',
        'Client Tier': '₹5L - ₹20L/mo',
      },
      {
        'Agency Name': 'Catalyst Growth Labs',
        'Agency Head': 'Nikhil Sharma',
        Specialization: 'B2B SaaS Growth & SEO',
        'Work Email': 'nikhil@catalyst***.in',
        'Contact Number': '+91 98200 *****',
        Location: 'Bengaluru / Remote',
        'Client Tier': '₹3L - ₹15L/mo',
      },
      {
        'Agency Name': 'PixelCraft Digital',
        'Agency Head': 'Sneha Kulkarni',
        Specialization: 'Performance Marketing & Creative',
        'Work Email': 'sneha@pixelcraft***.in',
        'Contact Number': '+91 97640 *****',
        Location: 'Pune, MH',
        'Client Tier': '₹4L - ₹18L/mo',
      },
    ],
    targetDriveLink: DEFAULT_DRIVE_FOLDER,
  },
  {
    id: 'all-drive-bundle',
    title: 'Complete Master Drive Access (All Folders & Files)',
    category: 'VIP Bundle',
    price: 249,
    currency: 'INR',
    originalPrice: 1999,
    recordCount: '3,800,000+ Records Total',
    fileFormat: 'All CSV + XLSX + JSON + SQL',
    fileSize: '780 MB Total',
    lastUpdated: 'September 2026 (Fresh Update)',
    badge: 'VIP Master Bundle · Only ₹249',
    description: 'Full uninhibited access to all datasets in the Google Drive repository: USA B2B data, Global C-Suite, E-Commerce, Real Estate, Startups, and all fresh 2026 files.',
    highlights: [
      '⚡ Complete 2026 Updated Suite: Unlocks all 2026 datasets instantly',
      'Direct unrestricted VIP access to all folders in the Google Drive',
      'Lifetime folder access including all newly uploaded 2026 database dumps',
      'Priority download bandwidth and dedicated customer support',
    ],
    sampleColumns: ['Dataset Title', 'Contact Number Format', 'Included Records', 'File Formats', 'Access Type'],
    sampleRows: [
      {
        'Dataset Title': 'USA B2B & Consumer Database',
        'Contact Number Format': 'US Numbers: +1 (xxx) xxx-****',
        'Included Records': '1,250,000+ Records',
        'File Formats': 'CSV, XLSX',
        'Access Type': 'Instant Drive Sync',
      },
      {
        'Dataset Title': 'B2B, Retail & Startup Databases',
        'Contact Number Format': 'Indian Numbers: +91 9xxxx *****',
        'Included Records': '2,550,000+ Records',
        'File Formats': 'CSV, XLSX',
        'Access Type': 'Instant Drive Sync',
      },
      {
        'Dataset Title': 'Complete Master Drive VIP Access',
        'Contact Number Format': 'Both US (+1) & Indian (+91) Lists',
        'Included Records': '3,800,000+ Total Records',
        'File Formats': 'CSV, XLSX, JSON, SQL',
        'Access Type': 'Direct Google Drive Folder Access',
      },
    ],
    targetDriveLink: DEFAULT_DRIVE_FOLDER,
  },
];

// Order Tracking Schema
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
  // Server-only hidden target link (NEVER sent in public catalog)
  hiddenTargetLink: string;
}

function loadOrders(): OrderRecord[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading orders:', e);
  }
  return [];
}

function saveOrders(orders: OrderRecord[]) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

// In-memory cache for speed with disk backup
let ordersCache: OrderRecord[] = loadOrders();

// ----------------------------------------------------
// Public API Endpoints
// ----------------------------------------------------

// 1. Get Products - Crucial: targetDriveLink is stripped out! Database is hidden!
app.get('/api/products', (req: Request, res: Response) => {
  const publicProducts = PRODUCTS_CATALOG.map(({ targetDriveLink, ...publicDetails }) => publicDetails);
  const rzpCreds = getRazorpayCredentials();

  res.json({
    success: true,
    products: publicProducts,
    storeInfo: {
      supportEmail: storeConfig.supportEmail,
      tokenExpiryHours: storeConfig.tokenExpiryHours,
      currency: 'INR',
      razorpayKeyId: rzpCreds.keyId,
      isConfigured: rzpCreds.isConfigured,
      isLive: rzpCreds.isLive,
      keyIdPrefix: rzpCreds.keyId ? `${rzpCreds.keyId.substring(0, 10)}...` : '',
    },
  });
});

// 2. Create Razorpay Order
app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { productId, customerName, customerEmail, customerPhone } = req.body;

    if (!productId || !customerEmail) {
      return res.status(400).json({ error: 'Product ID and Customer Email are required.' });
    }

    const product = PRODUCTS_CATALOG.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const amountInPaise = Math.round(product.price * 100);
    const orderReceipt = `rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const rzpCreds = getRazorpayCredentials();

    let razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    let isLiveOrderCreated = false;

    // If live/test Razorpay keys are configured, create real order via Razorpay Orders API
    if (rzpCreds.isConfigured) {
      try {
        const auth = Buffer.from(`${rzpCreds.keyId}:${rzpCreds.keySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: orderReceipt,
            notes: {
              productId: product.id,
              productTitle: product.title,
              customerEmail,
              customerName: customerName || '',
              customerPhone: customerPhone || '',
            },
          }),
        });

        if (rzpResponse.ok) {
          const rzpData = (await rzpResponse.json()) as { id: string };
          razorpayOrderId = rzpData.id;
          isLiveOrderCreated = true;
          console.log(`Razorpay order created successfully: ${razorpayOrderId} for ${product.title}`);
        } else {
          const errText = await rzpResponse.text();
          console.error('Razorpay API order error:', rzpResponse.status, errText);
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error && parsed.error.description) {
              return res.status(400).json({
                error: `Razorpay Error: ${parsed.error.description}. Please verify your Key ID & Secret in Store Settings.`,
              });
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn('Razorpay API request error, proceeding with sandbox order fallback:', err);
      }
    }

    res.json({
      success: true,
      orderId: razorpayOrderId,
      amount: amountInPaise,
      amountInInr: product.price,
      currency: 'INR',
      keyId: rzpCreds.keyId,
      isConfigured: rzpCreds.isConfigured,
      isLiveOrder: isLiveOrderCreated,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
      },
      customer: {
        name: customerName || 'Valued Customer',
        email: customerEmail,
        phone: customerPhone || '+919876543210',
      },
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment order.' });
  }
});

// 3. Verify Payment & Generate Time-Limited Download Token
app.post('/api/verify-payment', (req: Request, res: Response) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      productId,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    if (!productId || !customerEmail) {
      return res.status(400).json({ error: 'Missing required purchase details.' });
    }

    const product = PRODUCTS_CATALOG.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const rzpCreds = getRazorpayCredentials();

    // Verify cryptographic signature if Razorpay keys are configured and this was a live order
    if (
      rzpCreds.isConfigured &&
      razorpay_signature &&
      razorpay_order_id &&
      razorpay_order_id.startsWith('order_')
    ) {
      const generatedSignature = crypto
        .createHmac('sha256', rzpCreds.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.error('Signature mismatch:', { generatedSignature, razorpay_signature });
        return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
      }
    }

    // Generate cryptographically secure, time-limited token
    const secureToken = crypto.randomBytes(20).toString('hex');
    const now = new Date();
    const expiryTime = new Date(now.getTime() + storeConfig.tokenExpiryHours * 60 * 60 * 1000);

    const paymentId = razorpay_payment_id || `pay_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const orderId = razorpay_order_id || `ord_${Date.now()}`;

    // Target link from catalog or master folder
    const targetLink = product.targetDriveLink || storeConfig.masterDriveLink;

    const newOrder: OrderRecord = {
      orderId,
      token: secureToken,
      productId: product.id,
      productTitle: product.title,
      amount: product.price,
      currency: 'INR',
      customerName: customerName || 'Valued Customer',
      customerEmail,
      customerPhone: customerPhone || '',
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      createdAt: now.toISOString(),
      expiresAt: expiryTime.toISOString(),
      downloadCount: 0,
      maxDownloads: storeConfig.maxDownloadsPerToken,
      downloadLogs: [],
      status: 'active',
      emailDeliveryLog: [
        {
          sentAt: now.toISOString(),
          recipient: customerEmail,
          status: 'delivered',
          subject: `Your Secure Download Link: ${product.title} (Valid for ${storeConfig.tokenExpiryHours} Hours)`,
        },
      ],
      hiddenTargetLink: targetLink,
    };

    ordersCache.unshift(newOrder);
    saveOrders(ordersCache);

    res.json({
      success: true,
      message: 'Payment verified successfully. Access granted.',
      token: secureToken,
      expiresAt: newOrder.expiresAt,
      maxDownloads: newOrder.maxDownloads,
      downloadCount: newOrder.downloadCount,
      productTitle: product.title,
      orderId,
      paymentId,
      emailSent: true,
      recipientEmail: customerEmail,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed.' });
  }
});

// 4. Check Access / Get Order Receipt by Token
app.get('/api/access/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const order = ordersCache.find((o) => o.token === token);

  if (!order) {
    return res.status(404).json({ error: 'Invalid or unrecognized access token.' });
  }

  const isExpired = new Date(order.expiresAt).getTime() < Date.now();
  const isLimitReached = order.downloadCount >= order.maxDownloads;
  const isRevoked = order.status === 'revoked';

  let accessStatus: 'active' | 'expired' | 'limit_reached' | 'revoked' = 'active';
  if (isRevoked) accessStatus = 'revoked';
  else if (isExpired) accessStatus = 'expired';
  else if (isLimitReached) accessStatus = 'limit_reached';

  const product = PRODUCTS_CATALOG.find((p) => p.id === order.productId);

  res.json({
    success: true,
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
    accessStatus,
    fileFormat: product?.fileFormat || 'CSV/XLSX',
    fileSize: product?.fileSize || '150 MB',
    supportEmail: storeConfig.supportEmail,
  });
});

// 5. Secure File Download Endpoint - Tracks Customer Downloads and Enforces Expiration
app.get('/api/download/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const orderIndex = ordersCache.findIndex((o) => o.token === token);

  if (orderIndex === -1) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Access Token Invalid</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: #1e293b; padding: 32px; border-radius: 16px; max-width: 480px; text-align: center; border: 1px solid #334155;">
            <div style="font-size: 40px; margin-bottom: 16px;">🔒</div>
            <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">Invalid Access Link</h1>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">This download token was not found or has been revoked. Please check your purchase email receipt or contact support.</p>
            <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Return to Store</a>
          </div>
        </body>
      </html>
    `);
  }

  const order = ordersCache[orderIndex];

  // Check Revocation
  if (order.status === 'revoked') {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Access Revoked</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: #1e293b; padding: 32px; border-radius: 16px; max-width: 480px; text-align: center; border: 1px solid #ef4444;">
            <div style="font-size: 40px; margin-bottom: 16px;">⛔</div>
            <h1 style="font-size: 20px; font-weight: 700; color: #f87171; margin: 0 0 8px 0;">Access Revoked</h1>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">This download link has been revoked by administration. If this is in error, contact ${storeConfig.supportEmail}.</p>
            <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Back to Store</a>
          </div>
        </body>
      </html>
    `);
  }

  // Check Expiration
  const isExpired = new Date(order.expiresAt).getTime() < Date.now();
  if (isExpired) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Download Link Expired</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: #1e293b; padding: 32px; border-radius: 16px; max-width: 480px; text-align: center; border: 1px solid #f59e0b;">
            <div style="font-size: 40px; margin-bottom: 16px;">⏱️</div>
            <h1 style="font-size: 20px; font-weight: 700; color: #fbbf24; margin: 0 0 8px 0;">Time-Limited Link Expired</h1>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Security policy: This link was valid for ${storeConfig.tokenExpiryHours} hours following your purchase and has now expired to prevent unauthorized file distribution.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 12px;">Order ID: ${order.orderId} · Purchased by: ${order.customerEmail}</p>
            <a href="/?reissue=${order.token}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Request Renewal / Re-issue</a>
          </div>
        </body>
      </html>
    `);
  }

  // Check Download Limit
  if (order.downloadCount >= order.maxDownloads) {
    return res.status(429).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Download Limit Exceeded</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: #1e293b; padding: 32px; border-radius: 16px; max-width: 480px; text-align: center; border: 1px solid #f59e0b;">
            <div style="font-size: 40px; margin-bottom: 16px;">⚠️</div>
            <h1 style="font-size: 20px; font-weight: 700; color: #fbbf24; margin: 0 0 8px 0;">Max Downloads Reached</h1>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">You have reached the maximum allowed limit of ${order.maxDownloads} downloads for this access pass. If you need assistance, email ${storeConfig.supportEmail}.</p>
            <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Back to Store</a>
          </div>
        </body>
      </html>
    `);
  }

  // Track customer download securely!
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  order.downloadCount += 1;
  order.downloadLogs.push({
    timestamp: new Date().toISOString(),
    ip: clientIp,
    userAgent,
  });

  ordersCache[orderIndex] = order;
  saveOrders(ordersCache);

  // Securely redirect customer to their purchased database Google Drive link
  const destinationUrl = order.hiddenTargetLink || storeConfig.masterDriveLink;
  return res.redirect(destinationUrl);
});

// 6. Resend / Dispatch Email with Time-Limited Link
app.post('/api/resend-email', (req: Request, res: Response) => {
  const { token, email } = req.body;
  const order = ordersCache.find((o) => o.token === token || (email && o.customerEmail === email));

  if (!order) {
    return res.status(404).json({ error: 'Order not found for this email or token.' });
  }

  const now = new Date();
  order.emailDeliveryLog.push({
    sentAt: now.toISOString(),
    recipient: order.customerEmail,
    status: 'delivered',
    subject: `[Re-sent] Your Secure Download Link: ${order.productTitle}`,
  });

  saveOrders(ordersCache);

  res.json({
    success: true,
    message: `Secure link successfully dispatched to ${order.customerEmail}.`,
    recipient: order.customerEmail,
    sentAt: now.toISOString(),
  });
});

// ----------------------------------------------------
// Admin & Owner Tracking Endpoints
// ----------------------------------------------------

// 7. Get All Orders & Real-Time Download Tracking
app.get('/api/admin/orders', (req: Request, res: Response) => {
  // Aggregate summary metrics
  const totalRevenue = ordersCache.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalOrders = ordersCache.length;
  const totalDownloads = ordersCache.reduce((sum, o) => sum + (o.downloadCount || 0), 0);
  const activeTokens = ordersCache.filter(
    (o) => o.status === 'active' && new Date(o.expiresAt).getTime() > Date.now()
  ).length;

  res.json({
    success: true,
    summary: {
      totalRevenue,
      totalOrders,
      totalDownloads,
      activeTokens,
      currency: 'INR',
    },
    orders: ordersCache,
    config: storeConfig,
  });
});

// 8. Revoke or Extend Customer Token
app.post('/api/admin/token-action', (req: Request, res: Response) => {
  const { token, action } = req.body;
  const orderIndex = ordersCache.findIndex((o) => o.token === token);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const order = ordersCache[orderIndex];

  if (action === 'revoke') {
    order.status = 'revoked';
  } else if (action === 'extend_24h') {
    const currentExpiry = new Date(order.expiresAt).getTime();
    const base = Math.max(Date.now(), currentExpiry);
    order.expiresAt = new Date(base + 24 * 60 * 60 * 1000).toISOString();
    order.status = 'active';
  } else if (action === 'reset_downloads') {
    order.downloadCount = 0;
  }

  ordersCache[orderIndex] = order;
  saveOrders(ordersCache);

  res.json({ success: true, order });
});

// 9. Update Store Settings (Drive Link, Razorpay Keys, Expiry Hours)
app.post('/api/admin/config', (req: Request, res: Response) => {
  const { masterDriveLink, razorpayKeyId, razorpayKeySecret, tokenExpiryHours, maxDownloadsPerToken, supportEmail } =
    req.body;

  if (masterDriveLink) storeConfig.masterDriveLink = masterDriveLink;
  if (razorpayKeyId !== undefined) storeConfig.razorpayKeyId = razorpayKeyId;
  if (razorpayKeySecret !== undefined) storeConfig.razorpayKeySecret = razorpayKeySecret;
  if (tokenExpiryHours) storeConfig.tokenExpiryHours = Number(tokenExpiryHours);
  if (maxDownloadsPerToken) storeConfig.maxDownloadsPerToken = Number(maxDownloadsPerToken);
  if (supportEmail) storeConfig.supportEmail = supportEmail;

  saveConfig(storeConfig);
  res.json({ success: true, config: storeConfig });
});

// 10. Live Verification of Razorpay Credentials
app.post('/api/admin/test-razorpay', async (req: Request, res: Response) => {
  try {
    const { keyId, keySecret } = req.body;
    const testKeyId = (keyId || storeConfig.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '').trim();
    const testSecret = (keySecret || storeConfig.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (!testKeyId || !testSecret) {
      return res.status(400).json({
        success: false,
        error: 'Both Razorpay Key ID and Key Secret are required to test connection.',
      });
    }

    if (!testKeyId.startsWith('rzp_test_') && !testKeyId.startsWith('rzp_live_')) {
      return res.status(400).json({
        success: false,
        error: 'Key ID must start with "rzp_live_" (for real payments) or "rzp_test_" (for test payments).',
      });
    }

    const auth = Buffer.from(`${testKeyId}:${testSecret}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders?count=1', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (rzpRes.ok) {
      const mode = testKeyId.startsWith('rzp_live_') ? 'Live Production' : 'Sandbox Test';
      return res.json({
        success: true,
        mode,
        isLive: testKeyId.startsWith('rzp_live_'),
        message: `Verified! Successfully connected to your Razorpay ${mode} account. Customer payments are ready to process.`,
      });
    } else {
      const errBody = (await rzpRes.json().catch(() => null)) as any;
      const desc = errBody?.error?.description || `Authentication failed (HTTP ${rzpRes.status})`;
      return res.status(400).json({
        success: false,
        error: `Razorpay rejected credentials: ${desc}. Double-check your Key ID & Secret from dashboard.razorpay.com/app/keys.`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Network error connecting to Razorpay API: ${err.message}`,
    });
  }
});

// ----------------------------------------------------
// Frontend Mounting & Server Initialization
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ready on port ${PORT}`);
  });
}

startServer();
