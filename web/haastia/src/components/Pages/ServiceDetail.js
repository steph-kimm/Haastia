import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ServiceDetail.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import BookingCalendar from '../booking calendar/BookingCalendar';

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  );
};

function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingDate, setBookingDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/get-post/${id}`);
        setService(response.data);
        console.log("service", service)
        setTotalPrice(response.data.price);
      } catch (error) {
        console.error('Error fetching service:', error);
      }
    };

    fetchService();
  }, [id]);

  const handleBookNowClick = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (date) => {
    setBookingDate(date);
    setShowConfirmButton(true);
    // setShowDatePicker(false);
    // Proceed with booking logic, such as sending the selected date to the server
  };

  const handleConfirmClick = async () => {
    const bookingRequest = {
        client: 'client-id', // TODO: Replace with actual client id
        recipient: service.owner.id,
        post: service._id,
        selectedAddOns: [], // TODO: Add logic to handle selected add-ons
        requestType: 'service',
        dateTime: bookingDate,
    };

    try {
        const response = await fetch('/api/add-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingRequest),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Booking confirmed!');
            // Further logic after successful booking
        } else {
            alert('Error booking service:', data.message);
        }
    } catch (error) {
        console.error('Error booking service:', error);
    }
};


  const toggleAddOn = (addOn) => {
    let updatedAddOns = [...selectedAddOns];
    if (updatedAddOns.includes(addOn)) {
      updatedAddOns = updatedAddOns.filter(a => a !== addOn);
    } else {
      updatedAddOns.push(addOn);
    }
    setSelectedAddOns(updatedAddOns);

    const addOnsTotal = updatedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
    setTotalPrice(service.price + addOnsTotal);
  };

  if (!service) return <div>Loading...</div>;

  const depositAmount = Number(service.deposit ?? 0);

  return (
    <div className="service-detail-container">
      <div className="image-slider">
        {service.images.map((image, index) => (
          <img key={index} src={image.url} alt={service.title} />
        ))}
      </div>
      <div className="service-info">
        <h1>{service.title}</h1>
        <p>{service.description}</p>
        <div className="add-ons">
          <h3>Add-Ons</h3>
          {service.addOns.map((addOn, index) => (
            <div key={index} className="add-on-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedAddOns.includes(addOn)}
                  onChange={() => toggleAddOn(addOn)}
                />
                {addOn.title} (+${addOn.price})
              </label>
            </div>
          ))}
        </div>
        <div className="total-price">
          <h3>Total Price: {formatCurrency(totalPrice)}</h3>
          <p className="deposit-info">
            {depositAmount > 0
              ? `${formatCurrency(depositAmount)} deposit due at booking`
              : 'No deposit required'}
          </p>
        </div>
        {!showDatePicker && !showConfirmButton && (
                    <button className="book-now-button" onClick={handleBookNowClick}>Book Now</button>
                )}
        {showDatePicker && (
                    <div className="date-picker">
                      <BookingCalendar providerId={service.owner._id}/>
                        {/* <DatePicker
                            selected={bookingDate}
                            onChange={handleDateChange}
                            showTimeSelect
                            dateFormat="Pp"
                        /> */}
                    </div>
                )}
                {showConfirmButton && (
                    <button className="confirm-booking" onClick={handleConfirmClick}>Confirm</button>
                )}
      </div>
      
    </div>
  );
}

export default ServiceDetail;
