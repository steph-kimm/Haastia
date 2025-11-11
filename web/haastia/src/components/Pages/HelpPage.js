import React, { useState } from "react";
import "./HelpPage.css";

const SECTIONS = [
  {
    title: "For Professionals",
    items: [
      { q: "How do I create a professional account?", a: "Sign up → choose “Professional.” Complete business details, add services, set pricing, and connect payouts via Stripe." },
      { q: "How do I set/edit my availability?", a: "Dashboard → Availability. Add multiple shifts per day, mark full-day availability, or block specific time ranges." },
      { q: "How do I manage bookings?", a: "Dashboard → Appointments. Open a booking to approve/confirm, reschedule, or cancel. Clients get automatic email updates." },
      { q: "How do payments/payouts work?", a: "All payments are processed by Stripe. After a completed appointment, payouts follow Stripe’s schedule to your connected account." },
      { q: "How do subscriptions work?", a: "Professionals subscribe monthly. Free trial available. Manage/cancel anytime under Dashboard → Billing." },
      { q: "How do I update services, photos, pricing?", a: "Dashboard → Services for service CRUD. Dashboard → Profile for photos, bio, business details, location." },
    ],
  },
  {
    title: "For Clients",
    items: [
      { q: "How do I book?", a: "Open a professional’s page, pick a service, choose a time, and confirm. You’ll receive an email confirmation." },
      { q: "Can I reschedule or cancel?", a: "Yes—use the link in your confirmation email or log in → Bookings. Policies depend on each professional." },
      { q: "Do I need an account?", a: "Booking as a guest is allowed. An account makes rebooking faster and keeps all your appointments in one place." },
      { q: "When am I charged?", a: "Depends on the pro’s policy (at booking or completion). All transactions are encrypted and handled by Stripe." },
    ],
  },
  {
    title: "General & Technical",
    items: [
      { q: "How do I reset my password?", a: "Click “Forgot Password?” on login, then follow instructions sent to your email." },
      { q: "Is my data secure?", a: "Yes—encryption in transit and at rest, secure auth, and Stripe for PCI-compliant payments. No raw card data stored." },
      { q: "I didn’t receive an email", a: "Check spam/promotions. Add team.haastia@gmail.com to contacts. Try resending from the relevant screen." },
      { q: "Supported browsers/devices", a: "Modern Chrome, Edge, Safari, Firefox. Fully responsive on mobile and desktop. Update your browser if needed." },
      { q: "Roadmap", a: "We’re building marketing tools, analytics, and loyalty features for pros. Suggestions are welcome via support." },
    ],
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState(null);

  const toggle = (id) => setOpen((cur) => (cur === id ? null : id));

  // NOTE: No form, no inputs — just a mailto link with subject preset to "Support:"
  const mailHref =
    "mailto:team.haastia@gmail.com?subject=" + encodeURIComponent("Support:");

  let idCounter = 0;

  return (
    <main className="hp-wrap">
      <header className="hp-hero">
        <h1>Help Center</h1>
        <p className="hp-sub">
          Quick answers for professionals and clients. If you still need help, reach out below.
        </p>
      </header>

      <section className="hp-grid" aria-label="Help topics">
        {SECTIONS.map((sec, sIdx) => (
          <div className="hp-card" key={sIdx}>
            <h2 className="hp-card-title">{sec.title}</h2>
            <div className="hp-accordion">
              {sec.items.map((item) => {
                const id = `acc-${idCounter++}`;
                const isOpen = open === id;
                return (
                  <article className={`hp-acc ${isOpen ? "open" : ""}`} key={id}>
                    <h3 className="hp-acc-h">
                      <button
                        className="hp-acc-btn"
                        onClick={() => toggle(id)}
                        aria-expanded={isOpen}
                        aria-controls={`${id}-panel`}
                        id={`${id}-button`}
                      >
                        <span className="hp-q">{item.q}</span>
                        <span className="hp-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div
                      id={`${id}-panel`}
                      role="region"
                      aria-labelledby={`${id}-button`}
                      className="hp-acc-panel"
                      style={{ maxHeight: isOpen ? "320px" : 0 }}
                    >
                      <p className="hp-a">{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <footer className="hp-support" aria-labelledby="support-heading">
        <h2 id="support-heading">Need more help?</h2>
        <p>
          If you need help, please contact customer service at{" "}
          <a href="mailto:team.haastia@gmail.com">team.haastia@gmail.com</a>.
        </p>
        <p className="hp-mailto">
          <a className="hp-mailto-btn" href={mailHref}>
            Email Support (subject: “Support:”)
          </a>
        </p>
      </footer>
    </main>
  );
}
