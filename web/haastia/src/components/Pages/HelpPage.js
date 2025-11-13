import React, { useState } from "react";
import "./HelpPage.css";

const FAQ_GROUPS = [
  {
    title: "Getting started",
    items: [
      {
        q: "How do I create a professional profile?",
        a: "Select “Sign up” → choose Professional → add your business details, service categories, pricing, and photos. Once you publish, your profile is searchable to all Haastia clients.",
      },
      {
        q: "What should I set up first?",
        a: "We recommend finishing your profile, connecting Stripe for payouts, and configuring your weekly availability. Those three steps let you accept bookings right away.",
      },
      {
        q: "Can multiple team members log in?",
        a: "Yes. Invite teammates from Dashboard → Settings → Team. Each teammate gets their own login and permission level for calendar, messaging, and payouts.",
      },
    ],
  },
  {
    title: "Bookings & payments",
    items: [
      {
        q: "How do clients book my services?",
        a: "Clients pick a service on your profile, choose an available time, and confirm with their email. They receive instant confirmation plus reminders before the appointment.",
      },
      {
        q: "When are clients charged?",
        a: "You control the policy. Charge at booking for deposits or in full after the visit. All payments are processed securely through Stripe and deposited to your connected account.",
      },
      {
        q: "Can clients reschedule or cancel?",
        a: "Yes. They can manage appointments from their confirmation email or by logging into their Haastia account. Your cancellation window and fees apply automatically.",
      },
      {
        q: "How do refunds work?",
        a: "Initiate refunds from Dashboard → Payments. Full or partial refunds are supported, and clients receive an email notification when the refund is issued.",
      },
    ],
  },
  {
    title: "Availability & scheduling",
    items: [
      {
        q: "Where do I manage my availability?",
        a: "Open Dashboard → Availability. Set repeating weekly hours, add one-off openings, or block time for personal events from the same screen.",
      },
      {
        q: "Can I sync with Google or Outlook?",
        a: "Calendar syncing is available under Dashboard → Integrations. Connect Google Calendar or Outlook to automatically block off conflicts.",
      },
      {
        q: "How are reminders sent?",
        a: "Email reminders go out 24 hours before an appointment. SMS reminders are optional and can be turned on in Settings → Notifications.",
      },
    ],
  },
  {
    title: "Troubleshooting & account",
    items: [
      {
        q: "I didn’t receive a verification or booking email.",
        a: "Check spam or promotions folders, then add team.haastia@gmail.com to your contacts. You can resend from the relevant page or by re-saving your email address.",
      },
      {
        q: "How do I reset my password?",
        a: "From the login screen, choose “Forgot password?” and follow the link emailed to you. Password reset links expire after one hour for security.",
      },
      {
        q: "Is my payment data secure?",
        a: "Yes. Haastia uses Stripe to handle all card information. We never store raw card numbers, and all traffic is encrypted in transit and at rest.",
      },
      {
        q: "How do I suggest a feature?",
        a: "We love feedback! Email team.haastia@gmail.com with “Feature request” in the subject and include as many details as possible so we can review with our product team.",
      },
    ],
  },
];

export default function HelpPage() {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  let runningId = 0;

  return (
    <main className="help-page">
      <header className="help-header">
        <section className="help-intro">
          <p className="eyebrow">Help Center</p>
          <h1>Answers for every step of the Haastia journey</h1>
          <p className="sub">
            Whether you’re setting up a professional profile or booking your next visit, these
            quick answers cover the questions we hear most often from the community.
          </p>
          <ul className="help-points">
            <li>Step-by-step guidance for professionals and clients.</li>
            <li>Tips for payments, scheduling, and integrations.</li>
            <li>Direct contact with the Haastia support team when you need it.</li>
          </ul>
        </section>

        <aside className="help-support-card" aria-labelledby="support-heading">
          <h2 id="support-heading">Need a hand from a human?</h2>
          <p>
            Our support specialists monitor inboxes throughout the business day. Share screenshots or
            booking links so we can troubleshoot quickly.
          </p>
          <a className="help-contact" href="mailto:team.haastia@gmail.com">
            team.haastia@gmail.com
          </a>
          <p className="help-meta">Average response time: under one business day.</p>
        </aside>
      </header>

      <section className="faq-section" aria-label="Frequently asked questions">
        <div className="faq-header">
          <h2>Popular questions</h2>
          <p>
            Explore curated answers for the topics customers and professionals ask most. Tap any
            question to view a concise walkthrough.
          </p>
        </div>

        <div className="faq-grid">
          {FAQ_GROUPS.map((group, groupIndex) => (
            <div className="faq-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="faq-list">
                {group.items.map((item) => {
                  const id = `faq-${runningId++}`;
                  const isOpen = openId === id;

                  return (
                    <article className={`faq-item ${isOpen ? "open" : ""}`} key={id}>
                      <h4>
                        <button
                          type="button"
                          className="faq-toggle"
                          onClick={() => toggle(id)}
                          aria-expanded={isOpen}
                          aria-controls={`${id}-panel`}
                          id={`${id}-button`}
                        >
                          <span className="faq-question">{item.q}</span>
                          <span className="faq-icon" aria-hidden="true" />
                        </button>
                      </h4>
                      <div
                        id={`${id}-panel`}
                        role="region"
                        aria-labelledby={`${id}-button`}
                        className="faq-panel"
                        style={{ maxHeight: isOpen ? "320px" : 0 }}
                      >
                        <p>{item.a}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-resources">
        <h2>Still looking for something else?</h2>
        <p>
          Reach out to <a href="mailto:team.haastia@gmail.com">team.haastia@gmail.com</a> with a
          short summary of what you need. We can provide account reviews, fix booking issues, or
          connect you with onboarding specialists for one-on-one guidance.
        </p>
      </section>
    </main>
  );
}
