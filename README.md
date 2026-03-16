# Turf Booking App (Demo)

A simple turf booking web app with Stripe Checkout payment integration. This project is intended as a starting point so you can customize it for production use.

## Features

- Browse available time slots
- Enter user details & book a turf slot
- Pay via Stripe Checkout (test mode)
- Stores bookings in memory (demo only)

## Getting started

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set your Stripe keys in `.env`:

   ```ini
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PORT=3000
   ```

4. Run the app:

   ```bash
   npm start
   ```

5. Open http://localhost:3000 in your browser.

## Stripe webhook (optional but recommended)

To mark bookings as paid, configure a webhook endpoint:

- Endpoint: `http://localhost:3000/webhook`
- Events: `checkout.session.completed`

When running locally you can use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/webhook
```

## Notes

- This demo stores bookings in memory. Restarting the server clears bookings.
- For production, use a database (PostgreSQL, MongoDB, etc.) and add authentication.
- Replace test Stripe keys with live keys when going to production.
