import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './availability.css';
import { getValidToken } from '../utils/auth';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
  '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
];

const normalizeAvailability = (rawAvailability = []) => {
  const map = new Map(
    rawAvailability
      .filter((entry) => entry?.day)
      .map((entry) => [
        entry.day,
        Array.isArray(entry.slots)
          ? [...entry.slots].sort()
          : [],
      ])
  );

  return weekdays.map((day) => ({
    day,
    slots: map.get(day) || [],
  }));
};

const AvailabilityEditor = () => {
  const navigate = useNavigate();
  const auth = getValidToken();
  const userId = auth?.payload?._id || auth?.payload?.id || null;
  const [availability, setAvailability] = useState(() => normalizeAvailability());
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!auth) {
      navigate('/login');
    }
  }, [auth, navigate]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        // TODO: do we have to get the user here? More efficient if we dont?
        const { data } = await axios.get(`http://localhost:8000/api/get-user/${userId}`);
        setAvailability(normalizeAvailability(data.availability));
      } catch (err) {
        console.error('Error fetching availability', err);
      }
    };
    if (userId) fetchAvailability();
  }, [userId]);
  const toggleSlot = (day, slot) => {
    setAvailability(prev => {
      return prev.map(entry => {
        if (entry.day !== day) return entry;

        const isSelected = entry.slots.includes(slot);
        const updatedSlots = isSelected
          ? entry.slots.filter(s => s !== slot)
          : [...entry.slots, slot].sort();

        return { ...entry, slots: updatedSlots };
      });
    });
  };


  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const filteredAvailability = availability
        .filter(({ slots }) => slots.length)
        .map(({ day, slots }) => ({ day, slots }));

      await axios.put(`http://localhost:8000/api/update-availability/${userId}`, {
        availability: filteredAvailability,
      });
      setFeedback({ type: 'success', message: 'Availability updated successfully!' });
    } catch (err) {
      console.error('Error saving availability', err);
      setFeedback({ type: 'error', message: 'Something went wrong while saving. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSummary = useMemo(
    () => availability.filter(({ slots }) => slots.length > 0),
    [availability]
  );

  return (
    <div className="availability-editor">
      <div className="editor-head">
        <h3>Edit Your Weekly Availability</h3>
        <p className="editor-sub">
          Tap a time block to toggle it on or off. Selected hours show clients when you are free to
          take on appointments.
        </p>
      </div>

      <div className="availability-summary">
        <h4>This week at a glance</h4>
        {selectedSummary.length ? (
          <ul className="summary-list">
            {selectedSummary.map(({ day, slots }) => (
              <li key={day}>
                <span className="summary-day">{day}</span>
                <div className="summary-slots">
                  {slots.map((slot) => (
                    <span key={slot} className="summary-chip">{slot}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="summary-empty">No hours selected yet. Choose slots below to open up your calendar.</p>
        )}
      </div>

      <div className="week-grid">
        {weekdays.map(day => (
          <div key={day} className="day-column">
            <strong>{day}</strong>
            {timeSlots.map(slot => {
              const slotsForDay = availability.find(d => d.day === day)?.slots || [];
              const isSelected = slotsForDay.includes(slot);
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
      <div className="save-row">
        <button className="save-btn" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Availability'}
        </button>
        {feedback && (
          <span className={`save-feedback ${feedback.type}`}>{feedback.message}</span>
        )}
      </div>
    </div>
  );
};

export default AvailabilityEditor;
