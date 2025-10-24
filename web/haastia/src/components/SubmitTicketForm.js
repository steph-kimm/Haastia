import React, { useState } from 'react';
import axios from 'axios';
import './SubmitTicketForm.css'
const SubmitTicketForm = () => {
    const [category, setCategory] = useState('');
    const [serviceNumber, setServiceNumber] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
    };

    const handleServiceNumberChange = (e) => {
        setServiceNumber(e.target.value);
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            
            const response = await axios.post('http://localhost:8000/api/submit-ticket', {
                category,
                serviceNumber,
                description,
            });

            setSuccessMessage('Thank you, we will get back to you within 72 hours.');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Please log in to submit a support ticket.');
            } else {
                setError('An error occurred. Please try again.');
            }
        }
    };

    return (
        <div className="submit-ticket-container">
            <h2>Submit a Ticket</h2>
            <p>Need extra help? Then submit a ticket below and a team member will reach out to you.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        value={category}
                        onChange={handleCategoryChange}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="payment">Payment</option>
                        <option value="service">Service</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="serviceNumber">Service # (optional)</label>
                    <input
                        type="text"
                        id="serviceNumber"
                        value={serviceNumber}
                        onChange={handleServiceNumberChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={handleDescriptionChange}
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default SubmitTicketForm;
