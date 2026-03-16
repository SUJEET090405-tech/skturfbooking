require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Set it in .env or environment variables.');
}

const stripe = require('stripe')(stripeSecretKey);

app.use(cors());

// Use JSON parsing for API routes; keep /webhook raw so Stripe signature verification works.
app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory bookings store (for demo purposes).
// In production, store bookings in a real database.
const bookings = [];

// Offer a small set of time slots for booking.
const availableSlots = [
  '06:00 - 07:00',
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
];

app.get('/api/slots', (req, res) => {
  res.json({ slots: availableSlots });
});

app.get('/api/bookings', (req, res) => {
  res.json({ bookings });
});

app.post('/api/book', async (req, res) => {
  const { name, email, phone, date, slot } = req.body;

  if (!name || !email || !date || !slot) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  if (!availableSlots.includes(slot)) {
    return res.status(400).json({ error: 'Selected time slot is not available.' });
  }

  const priceInCents = 1000; // 10.00 in example currency
  const currency = 'inr';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Turf booking (${date} @ ${slot})`,
              description: '1-hour turf booking',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        name,
        phone: phone || '',
        date,
        slot,
      },
      success_url: `${req.protocol}://${req.get('host')}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
    });

    // Save booking data with placeholder status (paid will be confirmed by webhook).
    bookings.push({
      id: bookings.length + 1,
      name,
      email,
      phone,
      date,
      slot,
      price: priceInCents / 100,
      currency: currency.toUpperCase(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      checkoutSessionId: session.id,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    res.status(500).json({ error: 'Failed to create payment session.' });
  }
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'];

  if (!endpointSecret) {
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set. Webhook events will not be verified.');
  }

  let event = req.body;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    }
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const booking = bookings.find((b) => b.checkoutSessionId === session.id);
    if (booking) {
      booking.status = 'paid';
      booking.paymentIntent = session.payment_intent;
      booking.updatedAt = new Date().toISOString();
    }
  }

  res.json({ received: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Turf Booking app running at http://localhost:${PORT}`);
});
