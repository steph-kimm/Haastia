// controllers/stripeController.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    // Replace with your real Stripe Price ID from your $10/month product
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: "price_12345abc", // ⬅️ change this to your actual price ID
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe session creation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};
