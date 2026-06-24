const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const MENU = {
  'Seekh Kebab': 349, 'Paneer Tikka': 299, 'Classic Bruschetta': 249,
  'Butter Chicken': 449, 'Pan-Seared Salmon': 699, 'Dal Makhani': 349,
  'Hyderabadi Dum Biryani': 549, 'Royal Chicken Biryani': 449, 'Garden Veg Biryani': 349,
  'Truffle Cream Pasta': 599, 'Prime Beef Burger': 649, 'Grilled Tenderloin': 1199,
  'Gulab Jamun': 199, 'Chocolate Lava Cake': 299, 'New York Cheesecake': 279,
  'Royal Sunset Mocktail': 199, 'Signature Latte': 179, 'Saffron Lassi': 149,
};
const ALLOWED_DELIVERY_FEES = [49, 99, 149];

function calculateTotal(cart, deliveryFee) {
  if (!Array.isArray(cart) || cart.length === 0) throw new Error('Cart is empty');
  if (!ALLOWED_DELIVERY_FEES.includes(Number(deliveryFee))) throw new Error('Invalid delivery fee');
  let subtotal = 0;
  for (const item of cart) {
    const price = MENU[item.name];
    const qty = Number(item.qty);
    if (price === undefined) throw new Error('Unknown item: ' + item.name);
    if (!Number.isInteger(qty) || qty <= 0) throw new Error('Invalid quantity for: ' + item.name);
    subtotal += price * qty;
  }
  return { subtotal, total: subtotal + Number(deliveryFee) };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  try {
    const { cart, deliveryFee, customer } = req.body;
    const { total } = calculateTotal(cart, deliveryFee);
    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: 'order_' + Date.now(),
      notes: { customerName: customer?.name || '', phone: customer?.phone || '' },
    });
    res.status(200).json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('create-order error:', err);
    res.status(400).json({ error: err.message || 'Could not create order' });
  }
};
