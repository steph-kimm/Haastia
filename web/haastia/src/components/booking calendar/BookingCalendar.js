import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const BookingDatePicker = ({ providerId }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);

    useEffect(() => {
        const fetchAvailableSlots = async () => {
            if (!providerId) return;
            try {
                const response = await axios.get(`http://localhost:8000/api/bookings/professional/${providerId}/available-slots`);
                setAvailableSlots(response.data || []);
            } catch (error) {
                console.error('Error fetching available slots:', error);
                setAvailableSlots([]);
            }
        };

        fetchAvailableSlots();
    }, [providerId]);

    const toEpochTime = (timeString) => new Date(`1970-01-01T${timeString}:00Z`);

    const getSlotsForDay = (date) => {
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        const entry = availableSlots.find(slot => slot.day === day);
        return entry?.slots?.filter(Boolean) || [];
    };

    const getMinTimeForDay = (date) => {
        const slots = getSlotsForDay(date);
        if (!slots.length) return new Date('1970-01-01T00:00:00Z');

        const earliest = slots
            .map(slot => slot.split('-')[0])
            .filter(Boolean)
            .sort()[0];

        return earliest ? toEpochTime(earliest) : new Date('1970-01-01T00:00:00Z');
    };

    const getMaxTimeForDay = (date) => {
        const slots = getSlotsForDay(date);
        if (!slots.length) return new Date('1970-01-01T23:59:59Z');

        const sorted = slots
            .map(slot => slot.split('-')[1])
            .filter(Boolean)
            .sort();

        const latest = sorted[sorted.length - 1];

        return latest ? toEpochTime(latest) : new Date('1970-01-01T23:59:59Z');
    };

    const isSlotAvailable = (time) => {
        const slots = getSlotsForDay(time);
        if (!slots.length) return false;

        const timeString = time.toTimeString().split(' ')[0].substring(0, 5);
        return slots.some(slot => {
            const [start, end] = slot.split('-');
            return start && end && timeString >= start && timeString < end;
        });
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    return (
        <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            minDate={new Date()} // Prevent booking past dates
            minTime={selectedDate && getMinTimeForDay(selectedDate)}
            maxTime={selectedDate && getMaxTimeForDay(selectedDate)}
            filterTime={isSlotAvailable}
            dateFormat="MMMM d, yyyy h:mm aa"
            placeholderText="Select a date and time"
        />
    );
};

export default BookingDatePicker;
