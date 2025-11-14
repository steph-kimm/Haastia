import React from 'react';

const ProfessionalPaymentSection = () => {
  return (
    <section className="provider-payment-card" aria-labelledby="provider-payment-heading">
      <header className="provider-payment-header">
        <div className="provider-payment-icon" aria-hidden="true">💼</div>
        <div>
          <p className="provider-payment-eyebrow">Haastia Pro</p>
          <h3 id="provider-payment-heading">Professional plan</h3>
          <p className="provider-payment-price">
            <span className="price-amount">$10</span>
            <span className="price-frequency">/month</span>
          </p>
        </div>
      </header>

      <ul className="provider-payment-benefits">
        <li>
          <span className="benefit-icon" aria-hidden="true">📅</span>
          <span>Showcase your availability so clients can book you instantly.</span>
        </li>
        <li>
          <span className="benefit-icon" aria-hidden="true">📈</span>
          <span>Unlock professional tools to manage requests and grow your business.</span>
        </li>
        <li>
          <span className="benefit-icon" aria-hidden="true">🛡️</span>
          <span>Secure Stripe-powered billing to protect you and your clients.</span>
        </li>
      </ul>

      <div className="provider-payment-footer">
        <div className="provider-payment-cta" role="note">
          <span className="cta-icon" aria-hidden="true">⚡</span>
          <span>Checkout loads securely below so you can enter your payment details without leaving Haastia.</span>
        </div>
        <p className="provider-payment-copy">Complete checkout below to finalize your $10/month professional subscription and start accepting bookings.</p>
      </div>
    </section>
  );
};

export default ProfessionalPaymentSection;
