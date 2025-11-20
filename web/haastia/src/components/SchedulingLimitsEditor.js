import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getValidToken } from '../utils/auth';
import './availability.css';

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

const SchedulingLimitsEditor = () => {
  const navigate = useNavigate();
  const auth = getValidToken();
  const token = auth?.token || null;

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

  const handleLimitsInputChange = (field) => (event) => {
    const value = event.target.value;
    setLimitsFeedback(null);
    setLimitsErrors((prev) => ({ ...prev, [field]: null }));
    setLimitsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const hasValue = (value) => value !== null && value !== undefined;

  return (
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
  );
};

export default SchedulingLimitsEditor;
