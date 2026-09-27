// Minimal local stand-in for the Razorpay Orders API, used only for end-to-end tests.
import http from 'http';
import crypto from 'crypto';

const KEY_ID = 'rzp_test_E2EKEY';
const KEY_SECRET = 'e2e_test_secret';
const EXPECTED_AUTH = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
const orders = new Map();

http
  .createServer((req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (req.headers.authorization !== EXPECTED_AUTH) {
      return send(401, { error: { code: 'BAD_REQUEST_ERROR', description: 'Authentication failed' } });
    }
    const url = new URL(req.url, 'http://x');
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (req.method === 'POST' && url.pathname === '/v1/orders') {
        const body = JSON.parse(raw || '{}');
        if (!Number.isInteger(body.amount) || body.amount < 100) {
          return send(400, { error: { description: 'The amount must be at least INR 1.00' } });
        }
        const order = {
          id: `order_${crypto.randomBytes(7).toString('hex')}`,
          entity: 'order',
          amount: body.amount,
          currency: body.currency,
          receipt: body.receipt,
          status: 'created',
          notes: body.notes || {},
        };
        orders.set(order.id, order);
        return send(200, order);
      }
      if (req.method === 'GET' && url.pathname === '/v1/orders') return send(200, { entity: 'collection', count: 0, items: [] });
      const m = url.pathname.match(/^\/v1\/orders\/([^/]+)$/);
      if (req.method === 'GET' && m) {
        const order = orders.get(m[1]);
        return order ? send(200, order) : send(400, { error: { description: 'The id provided does not exist' } });
      }
      send(404, { error: { description: 'not found' } });
    });
  })
  .listen(Number(process.env.MOCK_PORT || 3199), () => console.log('mock razorpay ready'));
