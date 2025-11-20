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

const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

const parseTimeValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(TIME_PATTERN);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
};

const formatTimeValue = (minutes) => {
  if (!Number.isFinite(minutes)) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const normalizeTimeString = (value) => {
  const minutes = parseTimeValue(value);
  if (minutes === null) return null;
  return formatTimeValue(minutes);
};

const slotDefinitions = timeSlots.map((slot) => {
  const [startRaw, endRaw] = slot.split('-');
  return {
    slot,
    startMinutes: parseTimeValue(startRaw),
    endMinutes: parseTimeValue(endRaw),
  };
});

const slotOrder = new Map(slotDefinitions.map(({ slot }, index) => [slot, index]));

const sortSlots = (slots = []) =>
  [...slots].sort((a, b) => {
    const orderA = slotOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
    const orderB = slotOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (orderA === orderB) {
      return a.localeCompare(b);
    }
    return orderA - orderB;
  });

const slotToInterval = (slot) => {
  if (!slot) return null;
  if (typeof slot === 'string') {
    const [startRaw, endRaw] = slot.split('-');
    const startMinutes = parseTimeValue(startRaw);
    const endMinutes = parseTimeValue(endRaw);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return null;
    }
    return { startMinutes, endMinutes };
  }
  if (typeof slot === 'object') {
    const startMinutes =
      parseTimeValue(slot.start) ??
      parseTimeValue(slot.begin) ??
      parseTimeValue(slot.from) ??
      parseTimeValue(slot.startTime);
    const endMinutes =
      parseTimeValue(slot.end) ??
      parseTimeValue(slot.finish) ??
      parseTimeValue(slot.to) ??
      parseTimeValue(slot.endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return null;
    }
    return { startMinutes, endMinutes };
  }
  return null;
};

const expandSlotsToGrid = (slots = []) => {
  if (!Array.isArray(slots)) return [];
  const selected = new Set();
  slots.forEach((slot) => {
    const interval = slotToInterval(slot);
    if (!interval) return;
    slotDefinitions.forEach((definition) => {
      if (definition.startMinutes === null || definition.endMinutes === null) {
        return;
      }
      if (
        definition.startMinutes >= interval.startMinutes &&
        definition.endMinutes <= interval.endMinutes
      ) {
        selected.add(definition.slot);
      }
    });
  });
  return sortSlots(Array.from(selected));
};

const consolidateSlots = (slots = []) => {
  if (!Array.isArray(slots) || !slots.length) return [];
  const sorted = sortSlots(slots);
  const ranges = [];
  sorted.forEach((slot) => {
    const [start, end] = slot.split('-');
    if (!ranges.length) {
      ranges.push({ start, end });
      return;
    }
    const last = ranges[ranges.length - 1];
    if (last.end === start) {
      last.end = end;
    } else {
      ranges.push({ start, end });
    }
  });
  return ranges.map(({ start, end }) => `${start}-${end}`);
};

const stringToSlot = (slot) => {
  if (slot && typeof slot === 'object' && slot.start && slot.end) {
    const start = normalizeTimeString(slot.start);
    const end = normalizeTimeString(slot.end);
    if (start && end) {
      return { start, end };
    }
    return null;
  }
  if (typeof slot === 'string') {
    const [start, end] = slot.split('-');
    const normalizedStart = normalizeTimeString(start);
    const normalizedEnd = normalizeTimeString(end);
    if (normalizedStart && normalizedEnd) {
      return { start: normalizedStart, end: normalizedEnd };
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
        Array.isArray(entry.slots) ? expandSlotsToGrid(entry.slots) : [],
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

const DEFAULT_SCHEDULING_LIMITS = {
  minBookingLeadTimeMinutes: 0,
  maxBookingDaysInAdvance: null,
  rescheduleCutoffMinutes: null,
  cancelCutoffMinutes: null,
  maxBookingsPerSlot: null,
  maxBookingsPerDay: null,
  maxBookingsPerWeek: null,
};

const minutesToHoursString = (value) => {
  if (value === null || value === undefined) return '';
  return (value / 60).toString();
};

const numericToString = (value) => {
  if (value === null || value === undefined) return '';
  return value.toString();
};

const formatLimitsForForm = (limits = {}) => ({
  minBookingLeadTimeHours: minutesToHoursString(limits.minBookingLeadTimeMinutes),
  rescheduleCutoffHours: minutesToHoursString(limits.rescheduleCutoffMinutes),
  cancelCutoffHours: minutesToHoursString(limits.cancelCutoffMinutes),
  maxBookingDaysInAdvance: numericToString(limits.maxBookingDaysInAdvance),
  maxBookingsPerSlot: numericToString(limits.maxBookingsPerSlot),
  maxBookingsPerDay: numericToString(limits.maxBookingsPerDay),
  maxBookingsPerWeek: numericToString(limits.maxBookingsPerWeek),
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

  const [limitsForm, setLimitsForm] = useState(() =>
    formatLimitsForForm(DEFAULT_SCHEDULING_LIMITS)
  );
  const [limitsErrors, setLimitsErrors] = useState({});
  const [limitsFeedback, setLimitsFeedback] = useState(null);
  const [isSavingLimits, setIsSavingLimits] = useState(false);

  const [limitsPreview, setLimitsPreview] = useState(() => ({
    minBookingLeadTimeHours: 0,
    rescheduleCutoffHours: null,
    cancelCutoffHours: null,
    maxBookingDaysInAdvance: null,
    maxBookingsPerSlot: null,
    maxBookingsPerDay: null,
    maxBookingsPerWeek: null,
  }));

  useEffect(() => {
    if (!auth) {
      navigate('/login');
    }
  }, [auth, navigate]);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const setLimitsFromServer = useCallback((limits) => {
    const normalized = { ...DEFAULT_SCHEDULING_LIMITS, ...(limits || {}) };
    setLimitsForm(formatLimitsForForm(normalized));
    setLimitsPreview({
      minBookingLeadTimeHours: normalized.minBookingLeadTimeMinutes / 60,
      rescheduleCutoffHours:
        normalized.rescheduleCutoffMinutes === null
          ? null
          : normalized.rescheduleCutoffMinutes / 60,
      cancelCutoffHours:
        normalized.cancelCutoffMinutes === null ? null : normalized.cancelCutoffMinutes / 60,
      maxBookingDaysInAdvance: normalized.maxBookingDaysInAdvance,
      maxBookingsPerSlot: normalized.maxBookingsPerSlot,
      maxBookingsPerDay: normalized.maxBookingsPerDay,
      maxBookingsPerWeek: normalized.maxBookingsPerWeek,
    });
  }, []);

  useEffect(() => {
    if (!authHeaders) return;
    let isActive = true;

    const fetchLimits = async () => {
      try {
        const { data } = await axios.get('/api/professional/me/profile', {
          headers: authHeaders,
        });
        if (!isActive) return;
        setLimitsFromServer(data?.professional?.schedulingLimits);
      } catch (err) {
        console.error('Error fetching scheduling limits', err);
      }
    };

    fetchLimits();
    return () => {
      isActive = false;
    };
  }, [authHeaders, setLimitsFromServer]);

  useEffect(() => {
    const safeNumber = (value) => {
      const trimmed = typeof value === 'string' ? value.trim() : value;
      if (trimmed === '') return null;
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
    };

    setLimitsPreview((prev) => ({
      ...prev,
      minBookingLeadTimeHours: safeNumber(limitsForm.minBookingLeadTimeHours) ?? 0,
      rescheduleCutoffHours: safeNumber(limitsForm.rescheduleCutoffHours),
      cancelCutoffHours: safeNumber(limitsForm.cancelCutoffHours),
      maxBookingDaysInAdvance: safeNumber(limitsForm.maxBookingDaysInAdvance),
      maxBookingsPerSlot: safeNumber(limitsForm.maxBookingsPerSlot),
      maxBookingsPerDay: safeNumber(limitsForm.maxBookingsPerDay),
      maxBookingsPerWeek: safeNumber(limitsForm.maxBookingsPerWeek),
    }));
  }, [limitsForm]);

  useEffect(() => {
    if (!userId) return;
    let isActive = true;

    const fetchAvailability = async () => {
      try {
        const { data } = await axios.get(`/api/availability/${userId}`);
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
        const { data } = await axios.get(`/api/blocked-times/${userId}`, {
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
          ? sortSlots(entry.slots.filter((s) => s !== slot))
          : sortSlots([...entry.slots, slot]);

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
        `/api/availability/${userId}`,
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

  const parseHoursField = (value, label) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed === '') {
      return { value: null };
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return { error: `${label} must be a non-negative number` };
    }

    return { value: Math.round(numeric * 60) };
  };

  const parseCountField = (value, label) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed === '') {
      return { value: null };
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return { error: `${label} must be a non-negative number` };
    }

    return { value: Math.floor(numeric) };
  };

  const handleSaveLimits = async () => {
    if (!authHeaders) return;
    setIsSavingLimits(true);
    setLimitsFeedback(null);

    const errors = {};
    const payload = {};

    const hoursFields = [
      { field: 'minBookingLeadTimeHours', label: 'Booking lead time', target: 'minBookingLeadTimeMinutes' },
      { field: 'rescheduleCutoffHours', label: 'Reschedule cutoff', target: 'rescheduleCutoffMinutes' },
      { field: 'cancelCutoffHours', label: 'Cancel cutoff', target: 'cancelCutoffMinutes' },
    ];

    hoursFields.forEach(({ field, label, target }) => {
      const { error, value } = parseHoursField(limitsForm[field], label);
      if (error) {
        errors[field] = error;
      } else {
        payload[target] = value;
      }
    });

    const countFields = [
      { field: 'maxBookingDaysInAdvance', label: 'Max days in advance' },
      { field: 'maxBookingsPerSlot', label: 'Bookings per slot' },
      { field: 'maxBookingsPerDay', label: 'Bookings per day' },
      { field: 'maxBookingsPerWeek', label: 'Bookings per week' },
    ];

    countFields.forEach(({ field, label }) => {
      const { error, value } = parseCountField(limitsForm[field], label);
      if (error) {
        errors[field] = error;
      } else {
        payload[field] = value;
      }
    });

    if (Object.keys(errors).length) {
      setLimitsErrors(errors);
      setLimitsFeedback({ type: 'error', message: 'Fix the highlighted fields to save your limits.' });
      setIsSavingLimits(false);
      return;
    }

    setLimitsErrors({});

    try {
      const { data } = await axios.put(
        '/api/professional/me/profile',
        { schedulingLimits: payload },
        { headers: authHeaders }
      );

      setLimitsFromServer(data?.professional?.schedulingLimits);
      setLimitsFeedback({ type: 'success', message: 'Scheduling limits updated.' });
    } catch (err) {
      console.error('Error saving scheduling limits', err);
      setLimitsFeedback({
        type: 'error',
        message: err?.response?.data?.error || 'Could not save limits right now. Please try again.',
      });
    } finally {
      setIsSavingLimits(false);
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

  const handleLimitsInputChange = (field) => (event) => {
    const value = event.target.value;
    setLimitsFeedback(null);
    setLimitsErrors((prev) => ({ ...prev, [field]: null }));
    setLimitsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        `/api/blocked-times/${userId}`,
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
      await axios.delete(`/api/blocked-times/${id}`, {
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
    () =>
      availability
        .map(({ day, slots }) => ({
          day,
          slots: consolidateSlots(slots),
        }))
        .filter(({ slots }) => slots.length > 0),
    [availability]
  );

  const hasValue = (value) => value !== null && value !== undefined;

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

      <div className="limits-card">
        <div className="limits-head">
          <div>
            <h4>Scheduling limits</h4>
            <p className="limits-sub">
              Set guardrails similar to Acuity: require advance notice for bookings and changes,
              limit how far out clients can book, and cap the number of spots per time slot or day.
            </p>
          </div>
          <div className="limits-preview">
            <h5>Client-facing preview</h5>
            <ul>
              <li>
                {hasValue(limitsPreview.minBookingLeadTimeHours)
                  ? `Clients must book at least ${limitsPreview.minBookingLeadTimeHours} hour${
                      limitsPreview.minBookingLeadTimeHours === 1 ? '' : 's'
                    } before start time.`
                  : 'Bookings require notice before the appointment start time.'}
              </li>
              <li>
                {hasValue(limitsPreview.maxBookingDaysInAdvance)
                  ? `They can book up to ${limitsPreview.maxBookingDaysInAdvance} day${
                      limitsPreview.maxBookingDaysInAdvance === 1 ? '' : 's'
                    } in advance.`
                  : 'Clients can book as far in advance as your availability allows.'}
              </li>
              <li>
                {hasValue(limitsPreview.rescheduleCutoffHours)
                  ? `Rescheduling closes ${limitsPreview.rescheduleCutoffHours} hour${
                      limitsPreview.rescheduleCutoffHours === 1 ? '' : 's'
                    } before the appointment.`
                  : 'Clients can reschedule until the start time.'}
              </li>
              <li>
                {hasValue(limitsPreview.cancelCutoffHours)
                  ? `Cancellations close ${limitsPreview.cancelCutoffHours} hour${
                      limitsPreview.cancelCutoffHours === 1 ? '' : 's'
                    } before start time.`
                  : 'Clients can cancel until the appointment begins.'}
              </li>
              <li>
                {hasValue(limitsPreview.maxBookingsPerSlot)
                  ? `Each slot allows up to ${limitsPreview.maxBookingsPerSlot} booking${
                      limitsPreview.maxBookingsPerSlot === 1 ? '' : 's'
                    }.`
                  : 'Slots accept unlimited bookings until you block them.'}
              </li>
              <li>
                {hasValue(limitsPreview.maxBookingsPerDay) || hasValue(limitsPreview.maxBookingsPerWeek)
                  ? `Daily cap: ${
                      hasValue(limitsPreview.maxBookingsPerDay)
                        ? limitsPreview.maxBookingsPerDay
                        : 'unlimited'
                    } · Weekly cap: ${
                      hasValue(limitsPreview.maxBookingsPerWeek)
                        ? limitsPreview.maxBookingsPerWeek
                        : 'unlimited'
                    }.`
                  : 'No daily or weekly caps are set.'}
              </li>
            </ul>
          </div>
        </div>

        <div className="limits-grid">
          <label className={limitsErrors.minBookingLeadTimeHours ? 'field-error' : undefined}>
            <div className="label-row">
              <span>Minimum notice to book (hours)</span>
              <span className="label-hint">Defaults to 0 hours (same-day bookings allowed)</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={limitsForm.minBookingLeadTimeHours}
              onChange={handleLimitsInputChange('minBookingLeadTimeHours')}
              placeholder="0"
            />
            <small className="field-hint">Acuity-style: require clients to book X hours before start time.</small>
            {limitsErrors.minBookingLeadTimeHours && (
              <span className="input-error">{limitsErrors.minBookingLeadTimeHours}</span>
            )}
          </label>

          <label className={limitsErrors.maxBookingDaysInAdvance ? 'field-error' : undefined}>
            <div className="label-row">
              <span>Max days in advance</span>
              <span className="label-hint">Leave blank to let clients book any future date</span>
            </div>
            <input
              type="number"
              min="0"
              step="1"
              value={limitsForm.maxBookingDaysInAdvance}
              onChange={handleLimitsInputChange('maxBookingDaysInAdvance')}
              placeholder="30"
            />
            <small className="field-hint">Acuity-style: stop bookings after X days out.</small>
            {limitsErrors.maxBookingDaysInAdvance && (
              <span className="input-error">{limitsErrors.maxBookingDaysInAdvance}</span>
            )}
          </label>

          <label className={limitsErrors.rescheduleCutoffHours ? 'field-error' : undefined}>
            <div className="label-row">
              <span>Reschedule cutoff (hours)</span>
              <span className="label-hint">Blank = rescheduling allowed up until start</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={limitsForm.rescheduleCutoffHours}
              onChange={handleLimitsInputChange('rescheduleCutoffHours')}
              placeholder="2"
            />
            <small className="field-hint">Acuity-style: changes must happen X hours before start time.</small>
            {limitsErrors.rescheduleCutoffHours && (
              <span className="input-error">{limitsErrors.rescheduleCutoffHours}</span>
            )}
          </label>

          <label className={limitsErrors.cancelCutoffHours ? 'field-error' : undefined}>
            <div className="label-row">
              <span>Cancel cutoff (hours)</span>
              <span className="label-hint">Blank = cancellations allowed anytime before start</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={limitsForm.cancelCutoffHours}
              onChange={handleLimitsInputChange('cancelCutoffHours')}
              placeholder="4"
            />
            <small className="field-hint">Acuity-style: cancellations must happen X hours before.</small>
            {limitsErrors.cancelCutoffHours && (
              <span className="input-error">{limitsErrors.cancelCutoffHours}</span>
            )}
          </label>

          <label className={limitsErrors.maxBookingsPerSlot ? 'field-error' : undefined}>
            <div className="label-row">
              <span>Bookings per slot</span>
              <span className="label-hint">Blank = unlimited per slot</span>
            </div>
            <input
              type="number"
              min="0"
              step="1"
              value={limitsForm.maxBookingsPerSlot}
              onChange={handleLimitsInputChange('maxBookingsPerSlot')}
              placeholder="1"
            />
            <small className="field-hint">Cap the number of clients in the same time block.</small>
            {limitsErrors.maxBookingsPerSlot && (
              <span className="input-error">{limitsErrors.maxBookingsPerSlot}</span>
            )}
          </label>

          <label className={limitsErrors.maxBookingsPerDay ? 'field-error' : undefined}>
            <div className="label-row">
              <span>Bookings per day</span>
              <span className="label-hint">Blank = no daily max</span>
            </div>
            <input
              type="number"
              min="0"
              step="1"
              value={limitsForm.maxBookingsPerDay}
              onChange={handleLimitsInputChange('maxBookingsPerDay')}
              placeholder="8"
            />
            <small className="field-hint">Useful when you only want a set number of appointments per day.</small>
            {limitsErrors.maxBookingsPerDay && (
              <span className="input-error">{limitsErrors.maxBookingsPerDay}</span>
            )}
          </label>

          <label className={limitsErrors.maxBookingsPerWeek ? 'field-error' : undefined}>
            <div className="label-row">
              <span>Bookings per week</span>
              <span className="label-hint">Blank = no weekly max</span>
            </div>
            <input
              type="number"
              min="0"
              step="1"
              value={limitsForm.maxBookingsPerWeek}
              onChange={handleLimitsInputChange('maxBookingsPerWeek')}
              placeholder="20"
            />
            <small className="field-hint">Keep your weekly workload manageable.</small>
            {limitsErrors.maxBookingsPerWeek && (
              <span className="input-error">{limitsErrors.maxBookingsPerWeek}</span>
            )}
          </label>
        </div>

        <div className="limits-actions">
          <button type="button" onClick={handleSaveLimits} disabled={isSavingLimits}>
            {isSavingLimits ? 'Saving…' : 'Save scheduling limits'}
          </button>
          {limitsFeedback && (
            <span className={`limits-feedback ${limitsFeedback.type}`}>{limitsFeedback.message}</span>
          )}
        </div>
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
