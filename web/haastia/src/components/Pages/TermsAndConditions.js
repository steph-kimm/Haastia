import React from 'react';
import { Link } from 'react-router-dom';
import './auth/Auth.css';

const sections = [
  {
    title: '1. Eligibility & Account Basics',
    description:
      'By creating a Haastia account you confirm that you are at least 18 years old, the information you provide is accurate, and you will keep your credentials secure.',
    bullets: [
      'Share truthful business details, pricing, and availability information.',
      'Notify us immediately if you suspect unauthorized access to your account.',
      'One person or business may not maintain multiple accounts for the same role without written approval.',
    ],
  },
  {
    title: '2. Using Haastia Services',
    description:
      'Clients agree to schedule and pay for services through Haastia. Professionals agree to deliver services as described in their listings and to comply with all applicable laws and licensing requirements.',
    bullets: [
      'Do not use the platform for illegal, harmful, or discriminatory activity.',
      'Only confirm booking requests you can fulfill and update your calendar when conflicts arise.',
      'Respect community members—harassment, hate speech, or unsafe behavior can result in account removal.',
    ],
  },
  {
    title: '3. Payments, Fees, and Cancellations',
    description:
      'We partner with Stripe to process payments securely. Subscription fees for professionals and service payments for clients are subject to Haastia’s pricing schedule.',
    bullets: [
      'All transactions must be completed within Haastia to maintain coverage under our policies.',
      'Canceled appointments follow the cancellation windows shown during booking.',
      'Chargebacks or payment disputes may lead to temporary account holds while we investigate.',
    ],
  },
  {
    title: '4. Privacy & Data',
    description:
      'We collect and use your information to operate Haastia, personalize experiences, and comply with legal obligations. Review our Privacy Policy for complete details.',
    bullets: [
      'We never sell your personal information.',
      'We may share data with trusted processors (like Stripe) to deliver core features.',
      'You can request deletion of your account by contacting support; some data may be retained as required by law.',
    ],
  },
  {
    title: '5. Changes & Contact',
    description:
      'We may update these Terms from time to time. Continued use of Haastia after updates constitutes acceptance of the revised Terms.',
    bullets: [
      'When material changes happen, we’ll notify you via email or an in-app banner.',
      'If you disagree with updates, you must stop using Haastia and close your account.',
      'Need clarification? Reach out to our support team anytime.',
    ],
  },
];

const TermsAndConditions = () => {
  return (
    <div className="auth-page terms-page">
      <div className="auth-inner">
        <header className="auth-header">
          <span className="eyebrow">Terms & Conditions</span>
          <h1>Our commitment to safe, trusted experiences</h1>
          <p className="sub">
            These Terms and Conditions explain what we ask of every Haastia customer and professional.
            Please read them carefully before creating an account or completing any bookings.
          </p>
          <p className="helper-text">
            Last updated: November 20, 2025
          </p>
        </header>

        <section className="terms-content">
          <article className="terms-module">
            <h2>How the Terms work</h2>
            <p>
              The following sections highlight the responsibilities that keep Haastia&apos;s marketplace safe for
              both clients and professionals. They apply in addition to any supplemental policies you agree to during onboarding.
              If you ever have questions, reach out to <a className="auth-link" href="mailto:support@haastia.com">support@haastia.com</a>.
            </p>
          </article>

          {sections.map(({ title, description, bullets }) => (
            <article key={title} className="terms-module">
              <h3>{title}</h3>
              <p>{description}</p>
              <ul className="terms-list">
                {bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}

          <article className="terms-module">
            <h3>Accepting the Terms</h3>
            <p>
              By selecting &ldquo;I agree to the Terms and Conditions&rdquo; when signing up, you confirm that you have read and
              understand these commitments. You also agree that Haastia may communicate electronically with you about your account,
              bookings, subscriptions, and policy updates.
            </p>
            <p>
              If you are agreeing to these Terms on behalf of a business or organization, you represent that you have authority to bind that entity.
            </p>
          </article>
        </section>

        <footer className="terms-footer">
          <p>Ready to get started?</p>
          <Link className="auth-link" to="/signup">
            Return to signup
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default TermsAndConditions;
