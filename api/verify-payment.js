const crypto = require('crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ verified: false, error: 'Missing fields' }); return;
    }
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    res.status(200).json({ verified: expectedSignature === razorpay_signature });
  } catch (err) {
    console.error('verify-payment error:', err);
    res.status(500).json({ verified: false, error: 'Verification failed' });
  }
};
