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
        <div className="help-center-container">
            <h1>Help Center</h1>

            <section className="faq-section">
                <h2>For Sellers</h2>
                {sellersFAQs.map((faq, index) => (
                    <FAQ key={index} question={faq.question} answer={faq.answer} />
                ))}
            </section>

            <section className="faq-section">
                <h2>For Buyers</h2>
                {buyersFAQs.map((faq, index) => (
                    <FAQ key={index} question={faq.question} answer={faq.answer} />
                ))}
            </section>
            <div><SubmitTicketForm/></div>
            
        </div>
    );
};

export default HelpCenter;
