import React from "react";
import "./Home.css";

const featureHighlights = [
  {
    title: "Smart Scheduling",
    description:
      "Instant availability, buffers, and waitlists so you never double-book.",
  },
  {
    title: "Client Profiles",
    description:
      "Notes, preferences, and purchase history in one tidy view.",
  },
  {
    title: "Payment Flows",
    description:
      "Collect deposits, charge cards, and offer Klarna without extra tabs.",
  },
  {
    title: "Automated Messaging",
    description:
      "Text + email reminders and follow ups that go out automatically.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Create your studio",
    description: "Import your services or start from our industry templates.",
  },
  {
    step: "02",
    title: "Share your booking link",
    description: "Embed on Instagram, link in bio, or send directly to clients.",
  },
  {
    step: "03",
    title: "Get booked & paid",
    description: "Let Haastia manage reminders, deposits, and rebooking nudges.",
  },
];

const paymentOptions = [
  { title: "Cards & Tap to Pay", description: "Stripe-backed, fast, and secure." },
  { title: "Cash App & Klarna", description: "Offer the ways your clients already pay." },
  { title: "Deposits + No-Show Fees", description: "Hold the spot and protect your time." },
];

const perks = [
  "Bookings confirmed in under 60 seconds",
  "Unlimited clients & services",
  "Beautiful booking site included",
];

const Home = () => {
  return (
    <div className="home-shell">
      <section className="hero">
        <span className="hero-glow hero-glow-one" aria-hidden="true" />
        <span className="hero-glow hero-glow-two" aria-hidden="true" />
        <div className="hero-copy fade-up">
          <span className="hero-badge">Designed for independent beauty pros</span>
          <h1>Run your beauty studio from one calm dashboard.</h1>
          <p>
            Focus on clients while Haastia keeps your schedule full, your payments flowing,
            and your brand polished â€” no spreadsheets required.
          </p>

          <div className="hero-cta">
            <a href="/signup" className="btn btn-primary">
              Start free trial
            </a>
            <a href="#features" className="btn btn-ghost">
              Watch 2-min walkthrough
            </a>
          </div>

          <ul className="hero-perks">
            {perks.map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>

          <div className="hero-stats">
            <div className="stat-card">
              <p>10K+</p>
              <span>Appointments booked</span>
            </div>
            <div className="stat-card">
              <p>98%</p>
              <span>Fewer no-shows</span>
            </div>
            <div className="stat-card">
              <p>4.9/5</p>
              <span>Average review</span>
            </div>
          </div>

          <div className="hero-note fade-up delay-1">
            <p>â€œHaastia lets my day feel calm but fully booked â€” itâ€™s thoughtful without being fussy.â€</p>
            <span>â€” Mia, Brow Artist in Austin</span>
          </div>
        </div>

        <div className="hero-visual float">
          <div className="hero-card">
            <p className="hero-card-label">Today</p>
            <h3>7 bookings confirmed</h3>
            <p className="hero-card-value">$860 projected</p>
            <div className="hero-card-mini">
              <span>Auto reminders</span>
              <strong>On</strong>
            </div>
          </div>
          <img src="/mockup-phone.png" alt="Haastia App preview" />
        </div>
      </section>

      <section className="value-section fade-up delay-1">
        <div className="value-header">
          <p className="eyebrow">Why Haastia</p>
          <h2>Minimal tools that feel luxurious for clients.</h2>
          <p>
            Set up in minutes, send one link, and automate everything else. Your brand stays
            front and center while Haastia powers the busywork.
          </p>
        </div>
        <div className="value-chips">
          {["Easy setup", "Client experience", "Modern payments", "No hidden fees"].map(
            (chip) => (
              <span key={chip}>{chip}</span>
            )
          )}
        </div>
      </section>

      <section id="features" className="features fade-up delay-2">
        <div className="section-headline">
          <p className="eyebrow">Product</p>
          <h2>Everything you need, thoughtfully arranged.</h2>
        </div>
        <div className="feature-grid">
          {featureHighlights.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow fade-up delay-3">
        <div className="section-headline">
          <p className="eyebrow">How it works</p>
          <h2>A simple flow built for repeat clients.</h2>
        </div>
        <div className="workflow-grid">
          {workflowSteps.map((step) => (
            <div className="workflow-card" key={step.step}>
              <span>{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="payments fade-up delay-4">
        <div className="section-headline">
          <p className="eyebrow">Payments</p>
          <h2>Offer flexible ways to pay without extra hardware.</h2>
        </div>
        <div className="payment-grid">
          {paymentOptions.map((payment) => (
            <div className="payment-card" key={payment.title}>
              <h3>{payment.title}</h3>
              <p>{payment.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing fade-up delay-5">
        <div className="section-headline">
          <p className="eyebrow">Pricing</p>
          <h2>Simple, transparent plans.</h2>
          <p>Try every feature free for 30 days. No contracts and you can cancel anytime.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-tier">
            <p className="plan-badge">Monthly</p>
            <h3>$10<span>/month</span></h3>
            <p>Perfect for testing the waters with zero commitment.</p>
            <ul>
              <li>All scheduling + client tools</li>
              <li>Unlimited messages</li>
              <li>Standard support</li>
            </ul>
            <a href="/signup" className="btn btn-ghost">
              Start monthly
            </a>
          </div>
          <div className="pricing-tier highlighted">
            <p className="plan-badge">Yearly</p>
            <h3>$99<span>/year</span></h3>
            <p>Pay once, save 18%, and unlock priority support.</p>
            <ul>
              <li>Everything in Monthly</li>
              <li>Spotlight booking page</li>
              <li>Priority chat support</li>
            </ul>
            <a href="/signup" className="btn btn-primary">
              Choose yearly
            </a>
            <span className="savings-tag">Most popular</span>
          </div>
        </div>
      </section>

      <section className="cta fade-up delay-6">
        <h2>Bring calm to your calendar.</h2>
        <p>
          Launch in an afternoon. Clients book anytime, your brand looks polished,
          and your time is protected.
        </p>
        <a href="/signup" className="btn btn-primary">
          Create your account
        </a>
      </section>

      <footer className="footer">
        <p>Â© {new Date().getFullYear()} Haastia</p>
        <a href="mailto:team.haastia@gmail.com">team.haastia@gmail.com</a>
        <a href="/help">FAQ</a>
      </footer>
    </div>
  );
};

export default Home;

