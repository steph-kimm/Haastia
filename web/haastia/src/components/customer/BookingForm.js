import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import DatePicker from "react-datepicker";
import { getValidToken } from "../../utils/auth";
import {
  getDayAvailabilityForDate,
  groupBlockedTimesByDate,
  filterSlotsAgainstBlocks,
  toISODateString,
} from "../../utils/availability";
import "./booking-form.css";
import "react-datepicker/dist/react-datepicker.css";

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const BookingFormFields = ({
  professionalId,
  service,
  availability = [],
  onSuccess,
  canAcceptPayments = true,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [date, setDate] = useState("");
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedError, setBlockedError] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentOption, setPaymentOption] = useState(
    service?.deposit > 0 ? "deposit" : "full"
  );

  const auth = getValidToken();
  const token = auth?.token || "";
  const isLoggedIn = Boolean(token);
  const loggedInName = auth?.payload?.name;
  const loggedInEmail = auth?.payload?.email;
  const loggedInPhone = auth?.payload?.phone;

  const depositAvailable = Number(service?.deposit ?? 0) > 0;
  const servicePrice = Number(service?.price ?? 0);
  const depositAmount = depositAvailable ? Number(service?.deposit ?? 0) : 0;
  const amountDue = paymentOption === "full" ? servicePrice : depositAmount;

  const syncDateState = useCallback((value, explicitDate = null) => {
    if (value && ISO_DATE_PATTERN.test(value)) {
      setDate(value);
      if (explicitDate instanceof Date && !Number.isNaN(explicitDate.getTime())) {
        const normalized = new Date(explicitDate);
        normalized.setHours(0, 0, 0, 0);
        setSelectedDateObj(normalized);
      } else {
        const parsed = new Date(`${value}T00:00:00`);
        setSelectedDateObj(Number.isNaN(parsed.getTime()) ? null : parsed);
      }
      return;
    }

    setDate("");
    setSelectedDateObj(null);
  }, []);

  useEffect(() => {
    setPaymentOption(service?.deposit > 0 ? "deposit" : "full");
  }, [service?._id, service?.deposit]);

  useEffect(() => {
    if (!depositAvailable && paymentOption === "deposit") {
      setPaymentOption("full");
    }
  }, [depositAvailable, paymentOption]);

  useEffect(() => {
    if (!professionalId) return;
    const fetchBlockedTimes = async () => {
      setBlockedLoading(true);
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 90);
        const { data } = await axios.get(
          `/api/blocked-times/${professionalId}`,
          {
            params: {
              start: toISODateString(start),
              end: toISODateString(end),
            },
          }
        );
        setBlockedTimes(Array.isArray(data) ? data : []);
        setBlockedError("");
      } catch (err) {
        console.error("Error fetching blocked times:", err);
        setBlockedError("Some time slots may be unavailable right now.");
      } finally {
        setBlockedLoading(false);
      }
    };
    fetchBlockedTimes();
  }, [professionalId]);

  const blockedByDate = useMemo(
    () => groupBlockedTimesByDate(blockedTimes),
    [blockedTimes]
  );

  const availableSlotsForSelectedDate = useMemo(() => {
    const dayAvailability = getDayAvailabilityForDate(availability, date);
    const baseSlots = dayAvailability?.slots ?? [];
    const blocks = date ? blockedByDate.get(date) ?? [] : [];
    return filterSlotsAgainstBlocks(baseSlots, blocks);
  }, [availability, date, blockedByDate]);

  const handleDateChange = useCallback(
    (nextDate) => {
      if (!nextDate) {
        syncDateState("");
        setTimeSlot("");
        return;
      }

      const normalizedValue = toISODateString(nextDate);
      if (!normalizedValue) {
        syncDateState("");
        setTimeSlot("");
        return;
      }

      const dayAvailability = getDayAvailabilityForDate(availability, normalizedValue);

      if (!dayAvailability?.slots?.length) {
        setFeedback({
          type: "error",
          message: "No availability on the selected date. Please choose another date.",
        });
        syncDateState("");
        setTimeSlot("");
        return;
      }

      const blocks = blockedByDate.get(normalizedValue) ?? [];
      const openSlots = filterSlotsAgainstBlocks(dayAvailability?.slots ?? [], blocks);
      if (!blockedLoading && openSlots.length === 0) {
        setFeedback({
          type: "error",
          message: "All slots for that day are blocked off. Please choose another date.",
        });
        syncDateState("");
        setTimeSlot("");
        return;
      }

      if (feedback.type === "error") {
        setFeedback({ type: "", message: "" });
      }

      syncDateState(normalizedValue, nextDate);
      setTimeSlot("");
    },
    [availability, blockedByDate, blockedLoading, feedback.type, syncDateState]
  );

  const todayDate = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const isDateSelectable = useCallback(
    (candidate) => {
      if (!(candidate instanceof Date) || Number.isNaN(candidate.getTime())) {
        return false;
      }

      const normalized = new Date(candidate);
      normalized.setHours(0, 0, 0, 0);
      if (normalized < todayDate) {
        return false;
      }

      const iso = toISODateString(normalized);
      if (!iso) return false;

      const dayAvailability = getDayAvailabilityForDate(availability, iso);
      if (!dayAvailability?.slots?.length) {
        return false;
      }

      const blocks = blockedByDate.get(iso) ?? [];
      const openSlots = filterSlotsAgainstBlocks(dayAvailability?.slots ?? [], blocks);
      return openSlots.length > 0;
    },
    [availability, blockedByDate, todayDate]
  );

  useEffect(() => {
    if (!date) return;

    const dayAvailability = getDayAvailabilityForDate(availability, date);
    const hasSlots = dayAvailability?.slots?.length;

    if (!hasSlots || (!blockedLoading && availableSlotsForSelectedDate.length === 0)) {
      setFeedback({
        type: "error",
        message: "No availability on the selected date. Please choose another date.",
      });
      syncDateState("");
      setTimeSlot("");
    }
  }, [availability, date, availableSlotsForSelectedDate, blockedLoading, syncDateState]);

  useEffect(() => {
    if (!date || !timeSlot) return;
    const stillAvailable = availableSlotsForSelectedDate.some(
      (slot) => `${slot.start}-${slot.end}` === timeSlot
    );
    if (!stillAvailable) {
      setTimeSlot("");
    }
  }, [availableSlotsForSelectedDate, date, timeSlot]);

  const cardElementOptions = useMemo(
    () => ({
      style: {
        base: {
          fontSize: "16px",
          color: "#1f2933",
          fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont",
          "::placeholder": {
            color: "#9aa5b1",
          },
        },
        invalid: {
          color: "#ef4444",
        },
      },
      hidePostalCode: true,
    }),
    []
  );

  const resetForm = () => {
    syncDateState("");
    setTimeSlot("");
    if (!isLoggedIn) {
      setName("");
      setEmail("");
      setPhone("");
    }
    setCardMessage("");
    setPaymentOption(service?.deposit > 0 ? "deposit" : "full");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!service?._id || !professionalId) {
      return setFeedback({
        type: "error",
        message: "This service is unavailable for booking right now.",
      });
    }

    if (!date || !timeSlot) {
      return setFeedback({ type: "error", message: "Please select a date and time." });
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return setFeedback({
        type: "error",
        message: "Please choose a date that has not already passed.",
      });
    }

    const isSlotAvailable = availableSlotsForSelectedDate.some(
      (slot) => `${slot.start}-${slot.end}` === timeSlot
    );

    if (!isSlotAvailable) {
      return setFeedback({
        type: "error",
        message: `${service?.title || "This service"} is not available at the selected time.`,
      });
    }

    if (!isLoggedIn && (!name || !email || !phone)) {
      return setFeedback({
        type: "error",
        message: "Please provide your name, email, and phone number.",
      });
    }

    if (!canAcceptPayments) {
      return setFeedback({
        type: "error",
        message: "This professional can't accept payments yet. Please try again later.",
      });
    }

    if (!stripe || !elements) {
      return setFeedback({
        type: "error",
        message: "Payment details are still loading. Please wait a moment and try again.",
      });
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return setFeedback({
        type: "error",
        message: "Payment details are unavailable. Please refresh the page and try again.",
      });
    }

    try {
      setIsProcessingPayment(true);
      setFeedback({ type: "", message: "" });

      const payload = {
        professionalId,
        serviceId: service._id,
        date,
        timeSlot: {
          start: timeSlot.split("-")[0],
          end: timeSlot.split("-")[1],
        },
        paymentOption,
      };

      if (isLoggedIn) {
        payload.contactName = loggedInName;
        payload.contactEmail = loggedInEmail;
        payload.contactPhone = loggedInPhone;
      } else {
        payload.guestInfo = {
          name,
          email,
          phone,
        };
        payload.contactName = name;
        payload.contactEmail = email;
        payload.contactPhone = phone;
      }

      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined;

      const { data } = await axios.post(
        "/api/payment/service-booking-intent",
        payload,
        config
      );

      const clientSecret = data?.clientSecret;
      if (!clientSecret) {
        throw new Error("Unable to initialize payment for this booking.");
      }

      const billingDetails = Object.fromEntries(
        Object.entries({
          name: loggedInName || name,
          email: loggedInEmail || email,
          phone: loggedInPhone || phone,
        }).filter(([, value]) => Boolean(value))
      );

      const confirmation = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails,
        },
      });

      if (confirmation.error) {
        throw confirmation.error;
      }

      if (confirmation.paymentIntent?.status !== "succeeded") {
        throw new Error("Payment did not complete. Please try again.");
      }

      setFeedback({
        type: "success",
        message: "Payment received! Your booking request has been sent.",
      });

      cardElement.clear();
      resetForm();
      onSuccess?.({
        bookingId: data?.bookingId,
        paymentIntentId: confirmation.paymentIntent?.id,
        paymentOption,
      });
    } catch (err) {
      console.error(err);
      const friendlyMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to process payment. Please try again.";
      setFeedback({ type: "error", message: friendlyMessage });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const dateFieldError = !blockedLoading && blockedError;

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="booking-card">
        <div className="booking-header">
          <span className="booking-badge">Secure booking</span>
          <h3>Reserve {service?.title || "this service"}</h3>
          <p className="booking-lede">
            Choose a time, share your details, and submit payment to lock in your visit.
          </p>
          <div className="booking-price-chip" aria-live="polite">
            <span>Due today</span>
            <strong>{formatCurrency(amountDue)}</strong>
          </div>
        </div>

        {!canAcceptPayments && (
          <div className="booking-feedback warning">
            This professional can't accept payments yet. Please check back soon.
          </div>
        )}

        {feedback.message && (
          <div className={`booking-feedback ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <div className="booking-form-grid">
          <div className="booking-field">
            <label htmlFor="booking-date">
              Date <span aria-hidden="true">*</span>
            </label>
            <div className="booking-input-shell">
              <DatePicker
                id="booking-date"
                selected={selectedDateObj}
                onChange={handleDateChange}
                minDate={todayDate}
                filterDate={isDateSelectable}
                placeholderText="Choose a date"
                dateFormat="MMMM d, yyyy"
                className="booking-date-input"
              />
            </div>
          </div>

          <div className="booking-field">
            <label htmlFor="booking-slot">
              Time slot <span aria-hidden="true">*</span>
            </label>
            <div className="booking-input-shell">
              <select
                id="booking-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                disabled={!date || blockedLoading || availableSlotsForSelectedDate.length === 0}
              >
                <option value="">Select a time</option>
                {availableSlotsForSelectedDate.map((slot) => (
                  <option key={`${slot.start}-${slot.end}`} value={`${slot.start}-${slot.end}`}>
                    {slot.start} – {slot.end}
                  </option>
                ))}
              </select>
            </div>
            {blockedLoading && date && (
              <p className="booking-footnote muted">Checking for recent updates…</p>
            )}
            {date && !blockedLoading && availableSlotsForSelectedDate.length === 0 && (
              <p className="booking-footnote warning">No availability for the selected date.</p>
            )}
            {dateFieldError && <p className="booking-footnote warning">{blockedError}</p>}
          </div>

          {!isLoggedIn && (
            <>
              <div className="booking-field">
                <label htmlFor="guest-name">
                  Full name <span aria-hidden="true">*</span>
                </label>
                <div className="booking-input-shell">
                  <input
                    id="guest-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="booking-field">
                <label htmlFor="guest-email">
                  Email <span aria-hidden="true">*</span>
                </label>
                <div className="booking-input-shell">
                  <input
                    id="guest-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="booking-field">
                <label htmlFor="guest-phone">
                  Phone <span aria-hidden="true">*</span>
                </label>
                <div className="booking-input-shell">
                  <input
                    id="guest-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
              </div>
            </>
          )}

          <div className="booking-field">
            <div className="booking-section-header">
              <div>
                <label>Payment preference</label>
                <p className="booking-footnote muted">
                  Choose to pay a deposit now or settle the full balance.
                </p>
              </div>
            </div>
            <div className="payment-option-grid" role="radiogroup">
              {depositAvailable && (
                <label
                  className={`payment-option-card ${
                    paymentOption === "deposit" ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    value="deposit"
                    checked={paymentOption === "deposit"}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  />
                  <span className="option-label">Pay deposit</span>
                  <span className="option-amount">{formatCurrency(depositAmount)}</span>
                  <p className="booking-footnote muted">We'll charge the rest later.</p>
                </label>
              )}
              <label
                className={`payment-option-card ${paymentOption === "full" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentOption"
                  value="full"
                  checked={paymentOption === "full"}
                  onChange={(e) => setPaymentOption(e.target.value)}
                />
                <span className="option-label">Pay in full</span>
                <span className="option-amount">{formatCurrency(servicePrice)}</span>
                <p className="booking-footnote muted">Nothing else due after today.</p>
              </label>
            </div>
          </div>

          <div className="booking-field">
            <label>Payment details</label>
            <div className="booking-input-shell card-shell">
              <CardElement
                options={cardElementOptions}
                onChange={(event) => setCardMessage(event.error?.message || "")}
              />
            </div>
            {cardMessage && <p className="booking-footnote error">{cardMessage}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="booking-submit"
          disabled={
            isProcessingPayment ||
            !stripe ||
            !elements ||
            !canAcceptPayments ||
            !date ||
            !timeSlot ||
            (!!cardMessage && cardMessage.length > 0)
          }
        >
          {isProcessingPayment ? "Processing payment…" : "Confirm and pay"}
        </button>
      </div>
    </form>
  );
};

const BookingForm = (props) => {
  if (!stripePromise) {
    return (
      <div className="booking-form">
        <div className="booking-card">
          <div className="booking-header">
            <span className="booking-badge">Secure booking</span>
            <h3>Reserve {props?.service?.title || "this service"}</h3>
            <p className="booking-lede">
              Payments are unavailable because Stripe is not configured. Please contact support.
            </p>
          </div>
          <div className="booking-feedback error">
            Payments are unavailable right now. Please contact support.
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <BookingFormFields {...props} />
    </Elements>
  );
};

export default BookingForm;
