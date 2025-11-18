import React from 'react';
import FAQ from '../FAQ';
import './HelpCenter.css';
import SubmitTicketForm from '../SubmitTicketForm';

const HelpCenter = () => {
    const sellersFAQs = [
        { question: 'How do I list a service?', answer: 'You can list a service by going to your profile and clicking "Add Service".' },
        { question: 'How do I manage bookings?', answer: 'You can manage your bookings by navigating to the "Bookings" section in your profile.' },
        // Add more FAQs here...
    ];

    const buyersFAQs = [
        { question: 'How do I book a service?', answer: 'You can book a service by clicking on "Book Now" on the service details page.' },
        { question: 'How do I contact a seller?', answer: 'You can contact a seller by sending a message through their profile page.' },
        // Add more FAQs here...
    ];

    return (
        <div className="help-center-shell">
            <div className="help-center-container">
                <header className="help-hero">
                    <div className="help-hero-copy">
                        <span className="help-hero-badge">Support</span>
                        <h1>Help Center</h1>
                        <p className="help-hero-text">
                            Focus on great service while Haastia automates bookings, reminders, and payments.
                            Browse the FAQs below or reach out for a deeper walkthrough.
                        </p>
                        <div className="help-hero-actions">
                            <a href="/signup" className="btn btn-primary">Start free trial</a>
                            <a href="mailto:team.haastia@gmail.com" className="btn btn-ghost">Email support</a>
                        </div>
                    </div>
                    <div className="help-hero-card">
                        <p>Average reply time</p>
                        <strong>Under 1 business day</strong>
                        <a href="mailto:team.haastia@gmail.com">team.haastia@gmail.com</a>
                        <span>Send screenshots for the fastest help.</span>
                    </div>
                </header>

                <div className="faq-grid">
                    <section className="faq-section">
                        <div className="faq-section-head">
                            <h2>For Sellers</h2>
                            <p>Get your services live, keep calendars full, and control payouts.</p>
                        </div>
                        {sellersFAQs.map((faq, index) => (
                            <FAQ key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </section>

                    <section className="faq-section">
                        <div className="faq-section-head">
                            <h2>For Buyers</h2>
                            <p>Book confidently, stay updated, and manage appointments on the go.</p>
                        </div>
                        {buyersFAQs.map((faq, index) => (
                            <FAQ key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </section>
                </div>

                <section className="support-card">
                    <h2>Need something specific?</h2>
                    <p>Share details with our support team and we will follow up before the next business day.</p>
                    <SubmitTicketForm />
                </section>
            </div>
        </div>
    );
};

export default HelpCenter;
