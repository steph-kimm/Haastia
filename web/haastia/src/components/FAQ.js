import React, { useState } from 'react';
import './FAQ.css';

const FAQ = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleFAQ = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`faq-container ${isOpen ? 'open' : ''}`} onClick={toggleFAQ}>
            <div className="faq-question">
                {question}
            </div>
            {isOpen && <div className="faq-answer">{answer}</div>}
        </div>
    );
};

export default FAQ;