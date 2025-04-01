import React, { useState, useEffect } from 'react';
import ServiceItem from './components /ServiceItem';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Services.css'
function Services() {
    const [services, setServices] = useState([]);

    useEffect(() => {
        // Fetch services from the backend API
        const fetchUserServices = async () => {

            const token = localStorage.getItem('token');
            const userId = token ? jwtDecode(token)._id : null;
            try {
                console.log(userId)
                const response = await axios.get(`http://localhost:8000/api/get-posts-by-user/${userId}`);
                setServices(response.data);
            } catch (error) {
                console.error('Error fetching user services:', error);
            }
        };
        fetchUserServices();
    }, []);

    return (
        <div>
            <h2>Your Services</h2>
            {services.length > 0 ? (
                services.map(service => (
                    <ServiceItem key={service._id} service={service} />
                ))
            ) : (
                <p>No services available.</p>
            )}
        </div>
    );
}

export default Services;
