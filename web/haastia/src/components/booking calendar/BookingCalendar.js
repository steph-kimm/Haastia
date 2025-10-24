import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const BookingDatePicker = ({ providerId }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);

    useEffect(() => {
        const fetchAvailableSlots = async () => {
            try {
                const response = await axios.get(`/api/available-slots/${providerId}`);
                setAvailableSlots(response.data);
            } catch (error) {
                console.error('Error fetching available slots:', error);
            }
        };

        fetchAvailableSlots();
    }, [providerId]);

    const getMinTimeForDay = (date) => {
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        const slots = availableSlots.find(slot => slot.day === day);
        return slots ? new Date(`1970-01-01T${slots.slots[0].split('-')[0]}:00Z`) : new Date('1970-01-01T00:00:00Z');
    };

    const getMaxTimeForDay = (date) => {
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        const slots = availableSlots.find(slot => slot.day === day);
        return slots ? new Date(`1970-01-01T${slots.slots[slots.slots.length - 1].split('-')[1]}:00Z`) : new Date('1970-01-01T23:59:59Z');
    };

    const isSlotAvailable = (time) => {
        const day = time.toLocaleDateString('en-US', { weekday: 'long' });
        const slots = availableSlots.find(slot => slot.day === day);
        if (!slots) return false;

        const timeString = time.toTimeString().split(' ')[0].substring(0, 5);
        return slots.slots.some(slot => timeString >= slot.split('-')[0] && timeString < slot.split('-')[1]);
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
