import React, { useState } from 'react';
import axios from 'axios';
import './AddServiceForm.css'; // Import CSS
import { jwtDecode } from 'jwt-decode';

const AddServiceForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [duration, setDuration] = useState('');
    const [images, setImages] = useState([]);

    // Handle image uploads and convert to Base64 for Cloudinary
    const handleImageUpload = (e) => {
        const files = e.target.files;
        const fileArray = Array.from(files).map((file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(fileArray).then((imageData) => {
            setImages(imageData);
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
                // Get user from token
            const token = localStorage.getItem('token');
            if (!token) {
            console.error("No token found — user might not be logged in");
            return;
        }
            const serviceData = {
                title,
                description,
                price,
                category,
                duration,
                images,
                // owner, // passed from props
            };

            // const response = await axios.post('http://localhost:8000/api/add-post', serviceData);
            const response = await axios.post(
            'http://localhost:8000/api/add-post',
            serviceData,
            {
                headers: {
                    Authorization: `Bearer ${token}` // send token to backend
                }
            }
        );
            console.log('Service added:', response.data);
            // Reset the form
            setTitle('');
            setDescription('');
            setPrice('');
            setCategory('');
            setDuration('');
            setImages([]);
        } catch (error) {
            console.error('Error adding service:', error);
        }
    };

    return (
        <div className="service-form-container">
            <h2>Add a New Service</h2>
            <form onSubmit={handleSubmit} className="service-form">
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="price">Price ($):</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        min="20"
                        max="1000"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <input
                        type="text"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="duration">Duration (minutes):</label>
                    <input
                        type="number"
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="images">Upload Images (optional):</label>
                    <input
                        type="file"
                        id="images"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                    />
                </div>
                <button type="submit" className="submit-btn">
                    Add Service
                </button>
            </form>
        </div>
    );
};

export default AddServiceForm;
