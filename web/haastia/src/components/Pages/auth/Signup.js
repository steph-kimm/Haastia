import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Auth.css';
import { useView } from '../../../context/ViewContext'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    isProvider: false,
    availability: daysOfWeek.map(day => ({ day, slots: '' }))
  });
  const navigate = useNavigate();
  const { setCurrentView } = useView();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('availability')) {
      const index = parseInt(name.split('-')[1]);
      const newAvailability = [...formData.availability];
      newAvailability[index].slots = value;
      setFormData({ ...formData, availability: newAvailability });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Format availability properly
      const formattedAvailability = formData.availability
        .filter(a => a.slots.trim() !== '')
        .map(a => ({
          day: a.day,
          slots: a.slots.split(',').map(slot => {
            const [start, end] = slot.trim().split('-');
            return { start, end };
          })
        }));

      const payload = {
        ...formData,
        availability: formattedAvailability,
      };

      // ✅ Correct endpoint
      const response = await axios.post('http://localhost:8000/api/auth/signup', payload);

      const token = response.data.token;
      if (!token) throw new Error('No token received');

      localStorage.setItem('token', token);
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000 - Date.now();

      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/login');
      }, expirationTime);

      if (decodedToken.role === "professional") {
        setCurrentView('professional'); // switches context
        navigate('/add-service');       // goes to their page
      } else {
        setCurrentView('customer');
        navigate('/');
      }

    } catch (error) {
      console.error('Error signing up:', error);
      alert(error.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
      <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />

      <label>
        <input type="checkbox" name="isProvider" checked={formData.isProvider} onChange={handleChange} />
        I am a service provider
      </label>

      {formData.isProvider && (
        <div>
          <h3>Availability</h3>
          {daysOfWeek.map((day, index) => (
            <div key={day}>
              <label>{day}</label>
              <input
                type="text"
                name={`availability-${index}`}
                value={formData.availability[index].slots}
                onChange={handleChange}
                placeholder="e.g., 09:00-11:00, 14:00-17:00"
              />
            </div>
          ))}
        </div>
      )}

      <button type="submit">Sign Up</button>
    </form>
  );
};

export default Signup;
