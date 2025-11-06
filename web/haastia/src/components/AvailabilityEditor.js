import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './availability.css';
import { getValidToken } from '../utils/auth';
import { toISODateString } from '../utils/availability';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
  '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
];

const slotToString = (slot) => {
  if (typeof slot === 'string') {
    return slot;
  }
  if (slot && typeof slot === 'object') {
    const { start, end } = slot;
    if (start && end) {
      return `${start}-${end}`;
    }
  }
  return null;
};

const stringToSlot = (slot) => {
  if (slot && typeof slot === 'object' && slot.start && slot.end) {
    return { start: slot.start, end: slot.end };
  }
  if (typeof slot === 'string') {
    const [start, end] = slot.split('-');
    if (start && end) {
      return { start, end };
    }
  }
  return null;
};

const normalizeAvailability = (rawAvailability = []) => {
  const source = Array.isArray(rawAvailability)
    ? rawAvailability
    : rawAvailability
    ? [rawAvailability]
    : [];

  const flattened = source.flatMap((entry) => {
    if (entry?.day && Array.isArray(entry.slots)) {
      return [entry];
    }
    if (Array.isArray(entry?.availability)) {
      return entry.availability;
    }
    return [];
  });

  const map = new Map(
    flattened
      .filter((entry) => entry?.day)
      .map((entry) => [
        entry.day,
        Array.isArray(entry.slots)
          ? entry.slots
              .map(slotToString)
              .filter(Boolean)
              .sort()
          : [],
      ])
  );

  return weekdays.map((day) => ({
    day,
    slots: map.get(day) || [],
  }));
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const AvailabilityEditor = () => {
  const navigate = useNavigate();
  const auth = getValidToken();
  const token = auth?.token || null;
  const userId = auth?.payload?._id || auth?.payload?.id || null;
  const [availability, setAvailability] = useState(() => normalizeAvailability());
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [blockedTimes, setBlockedTimes] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockFeedback, setBlockFeedback] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [deletingBlockId, setDeletingBlockId] = useState(null);
  const [blockForm, setBlockForm] = useState({
    date: '',
    start: '',
    end: '',
    reason: '',
  });

  useEffect(() => {
    if (!auth) {
      navigate('/login');
    }
  }, [auth, navigate]);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  useEffect(() => {
    if (!userId) return;
    let isActive = true;

    const fetchAvailability = async () => {
      try {
        const { data } = await axios.get(`http://localhost:8000/api/availability/${userId}`);
        if (!isActive) return;
        setAvailability(normalizeAvailability(data));
      } catch (err) {
        console.error('Error fetching availability', err);
      }
    };

    fetchAvailability();
    return () => {
      isActive = false;
    };
  }, [userId]);

  const loadBlockedTimes = useCallback(
    async (withLoader = true) => {
      if (!userId) return;
      if (withLoader) {
        setBlockedLoading(true);
      }
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const params = { start: toISODateString(today) };
        const { data } = await axios.get(`http://localhost:8000/api/blocked-times/${userId}`, {
          params,
          headers: authHeaders,
        });
        setBlockedTimes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching blocked times', err);
        setBlockFeedback({
          type: 'error',
          message: 'Could not load blocked times. Please try again.',
        });
      } finally {
        if (withLoader) {
          setBlockedLoading(false);
        }
      }
    },
    [userId, authHeaders]
  );

  useEffect(() => {
    loadBlockedTimes();
  }, [loadBlockedTimes]);

  const toggleSlot = (day, slot) => {
    setAvailability((prev) =>
      prev.map((entry) => {
        if (entry.day !== day) return entry;

        const isSelected = entry.slots.includes(slot);
        const updatedSlots = isSelected
          ? entry.slots.filter((s) => s !== slot)
          : [...entry.slots, slot].sort();

        return { ...entry, slots: updatedSlots };
      })
    );
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const filteredAvailability = availability
        .filter(({ slots }) => slots.length)
        .map(({ day, slots }) => ({
          day,
          slots: slots
            .map(stringToSlot)
            .filter(Boolean),
        }));

      const res = await axios.post(
        `http://localhost:8000/api/availability/${userId}`,
        { availability: filteredAvailability }
      );

      console.log('Updated availability:', res.data);

      setFeedback({
        type: 'success',
        message: 'Availability updated successfully!',
      });
    } catch (err) {
      console.error('Error saving availability', err);
      setFeedback({
        type: 'error',
        message: 'Something went wrong while saving. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const upcomingBlocked = useMemo(() => {
    const now = Date.now();
    return (blockedTimes || [])
      .map((block) => {
        if (!block) return null;
        const baseDate = new Date(block.date);
        if (Number.isNaN(baseDate.getTime())) return null;
        baseDate.setHours(0, 0, 0, 0);
        const [startHour, startMinute] = (block.start || '').split(':').map(Number);
        const [endHour, endMinute] = (block.end || '').split(':').map(Number);
        if (
          !Number.isInteger(startHour) ||
          !Number.isInteger(startMinute) ||
          !Number.isInteger(endHour) ||
          !Number.isInteger(endMinute)
        ) {
          return null;
        }
        const startDate = new Date(baseDate);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(baseDate);
        endDate.setHours(endHour, endMinute, 0, 0);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          return null;
        }
        return {
          id: block._id || `${baseDate.toISOString()}-${block.start}-${block.end}`,
          startDate,
          endDate,
          reason: block.reason?.trim() || '',
        };
      })
      .filter((block) => block && block.endDate.getTime() >= now)
      .sort((a, b) => a.startDate - b.startDate);
  }, [blockedTimes]);

  const handleBlockInputChange = (field) => (event) => {
    const value = event.target.value;
    setBlockForm((prev) => ({ ...prev, [field]: value }));
    if (blockFeedback) {
      setBlockFeedback(null);
    }
  };

  const handleBlockSubmit = async (event) => {
    event.preventDefault();
    if (!userId) return;
    const { date, start, end, reason } = blockForm;

    if (!date || !start || !end) {
      setBlockFeedback({
        type: 'error',
        message: 'Please select a date along with a start and end time.',
      });
      return;
    }

    if (start >= end) {
      setBlockFeedback({
        type: 'error',
        message: 'End time must be after the start time.',
      });
      return;
    }

    if (!token) {
      setBlockFeedback({
        type: 'error',
        message: 'You must be signed in to manage blocked times.',
      });
      return;
    }

    setIsBlocking(true);
    setBlockFeedback(null);

    try {
      await axios.post(
        `http://localhost:8000/api/blocked-times/${userId}`,
        {
          date,
          start,
          end,
          reason: reason?.trim() || undefined,
        },
        { headers: authHeaders }
      );

      setBlockForm({ date: '', start: '', end: '', reason: '' });
      setBlockFeedback({ type: 'success', message: 'Blocked time added.' });
      await loadBlockedTimes(false);
    } catch (err) {
      console.error('Error creating blocked time', err);
      const message = err.response?.data?.error || 'Failed to add blocked time. Please try again.';
      setBlockFeedback({ type: 'error', message });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleDeleteBlockedTime = async (id) => {
    if (!id || !token) return;
    setDeletingBlockId(id);
    try {
      await axios.delete(`http://localhost:8000/api/blocked-times/${id}`, {
        headers: authHeaders,
      });
      await loadBlockedTimes(false);
    } catch (err) {
      console.error('Error deleting blocked time', err);
      const message = err.response?.data?.error || 'Failed to delete blocked time. Please try again.';
      setBlockFeedback({ type: 'error', message });
    } finally {
      setDeletingBlockId(null);
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

      <div className="blocked-section">
        <div className="blocked-head">
          <div>
            <h4>Time off &amp; one-off closures</h4>
            <p className="blocked-sub">
              Pick a date and time range to hide it from your calendar and the customer booking flow.
            </p>
          </div>
        </div>

        <form className="blocked-form" onSubmit={handleBlockSubmit}>
          <label>
            <span>Date</span>
            <input
              type="date"
              value={blockForm.date}
              onChange={handleBlockInputChange('date')}
              min={toISODateString(new Date())}
            />
          </label>
          <label>
            <span>Start</span>
            <input
              type="time"
              value={blockForm.start}
              onChange={handleBlockInputChange('start')}
            />
          </label>
          <label>
            <span>End</span>
            <input
              type="time"
              value={blockForm.end}
              onChange={handleBlockInputChange('end')}
            />
          </label>
          <label className="block-reason">
            <span>Reason (optional)</span>
            <input
              type="text"
              value={blockForm.reason}
              placeholder="Vacation, personal appointment, etc."
              onChange={handleBlockInputChange('reason')}
            />
          </label>
          <button type="submit" className="blocked-submit" disabled={isBlocking}>
            {isBlocking ? 'Saving…' : 'Block this time'}
          </button>
        </form>
        {blockFeedback && (
          <p className={`blocked-feedback ${blockFeedback.type}`}>{blockFeedback.message}</p>
        )}

        <div className="blocked-list-wrapper">
          {blockedLoading ? (
            <p className="blocked-loading">Loading blocked times…</p>
          ) : upcomingBlocked.length ? (
            <ul className="blocked-list">
              {upcomingBlocked.map((block) => (
                <li key={block.id} className="blocked-item">
                  <div className="blocked-meta">
                    <span className="blocked-date">{dateFormatter.format(block.startDate)}</span>
                    <span className="blocked-range">
                      {timeFormatter.format(block.startDate)} – {timeFormatter.format(block.endDate)}
                    </span>
                    {block.reason && <span className="blocked-reason-tag">{block.reason}</span>}
                  </div>
                  <button
                    type="button"
                    className="blocked-delete"
                    onClick={() => handleDeleteBlockedTime(block.id)}
                    disabled={deletingBlockId === block.id}
                  >
                    {deletingBlockId === block.id ? 'Removing…' : 'Remove'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="blocked-empty">No upcoming blocks. Add one above to reserve personal time.</p>
          )}
        </div>
      </div>

      <div className="week-grid">
        {weekdays.map((day) => (
          <div key={day} className="day-column">
            <strong>{day}</strong>
            {timeSlots.map((slot) => {
              const slotsForDay = availability.find((d) => d.day === day)?.slots || [];
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
