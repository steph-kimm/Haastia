import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './availability.css';
import { jwtDecode } from 'jwt-decode';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
  '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
];

const AvailabilityEditor = () => {
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token)._id : null;
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        // TODO: do we have to get the user here? More efficient if we dont?
        const { data } = await axios.get(`http://localhost:8000/api/get-user/${userId}`);
        setAvailability(data.availability || []);
      } catch (err) {
        console.error('Error fetching availability', err);
      }
    };
    if (userId) fetchAvailability();
  }, [userId]);
  const toggleSlot = (day, slot) => {
    setAvailability(prev => {
      const updated = prev.map(entry => {
        if (entry.day === day) {
          const slots = entry.slots.includes(slot)
            ? entry.slots.filter(s => s !== slot)
            : [...entry.slots, slot];
          return { ...entry, slots };
        }
        return entry;
      });
  
      // If the day doesn't exist, add it
      const exists = updated.find(entry => entry.day === day);
      if (!exists) {
        updated.push({ day, slots: [slot] });
      }
  
      return [...updated];
    });
  };
  

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:8000/api/update-availability/${userId}`, { availability });
      alert('Availability updated successfully!');
    } catch (err) {
      console.error('Error saving availability', err);
    }
  };

  return (
    <div className="availability-editor">
      <h3>Edit Your Weekly Availability</h3>
      <div className="week-grid">
        {weekdays.map(day => (
          <div key={day} className="day-column">
            <strong>{day}</strong>
            {timeSlots.map(slot => {
              const isSelected = availability.find(d => d.day === day)?.slots.includes(slot);
              return (
                <button
                  key={slot}
                  className={`slot-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSlot(day, slot)}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <button className="save-btn" onClick={handleSave}>Save Availability</button>
    </div>
  );
};

export default AvailabilityEditor;
