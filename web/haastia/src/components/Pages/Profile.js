import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Profile.css'
import axios from 'axios';

const UserProfile = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        console.log('HERE YOU GUYS')
        console.log('userId', userId)
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get(`/api/get-user/${userId}`);
                setUser(response.data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        const fetchUserServices = async () => {
            try {
                const response = await axios.get(`/api/get-posts-by-user/${userId}`);
                setServices(response.data);
            } catch (error) {
                console.error('Error fetching user services:', error);
            }
        };

        const fetchUserReviews = async () => {
            try {
                const response = await axios.get(`/api/get-reviews-by-user/${userId}`);
                setReviews(response.data);
            } catch (error) {
                console.error('Error fetching user reviews:', error);
            }
        };
        fetchUserProfile();
        fetchUserServices();
        fetchUserReviews();
    }, [userId]);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="user-profile">
            <div className="profile-section">
                <img src={user.image.url} alt={user.name} className="profile-picture" />
                <h2>{user.name}</h2>
            </div>
            <div className="photos-section">
                <h3>Photos</h3>
                <div className="photos-grid">
                    {services.map(service => (
                        service.images.map((image, index) => (
                            <img key={index} src={image.url} alt={`Service ${index}`} className="service-photo" />
                        ))
                    ))}
                </div>
            </div>
            <div className="services-section">
                <h3>Services Offered</h3>
                <div className="services-list">
                    {services.map(service => (
                        <div key={service._id} className="service-item">
                            <h4>{service.title}</h4>
                            <p>{service.description}</p>
                            <p className="price">${service.price}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="reviews-section">
                <h3>Reviews</h3>
                <div className="reviews-list">
                    {reviews.map(review => (
                        <div key={review._id} className="review-item">
                            <p>{review.comment}</p>
                            <p>Rating: {review.rating}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
