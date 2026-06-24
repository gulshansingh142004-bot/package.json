const crypto = require('crypto');

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method not allowed'); return; }
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) { res.status(400).send('Missing signature'); return; }
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
    if (signature !== expected) { res.status(400).send('Invalid signature'); return; }
    const payload = JSON.parse(rawBody);
    if (payload.event === 'payment.captured') {
      console.log('✅ Payment captured:', payload.payload.payment.entity.id);
    }
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook handler failed');
  }
};

module.exports.config = { api: { bodyParser: false } };
