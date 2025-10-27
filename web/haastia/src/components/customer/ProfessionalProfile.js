import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingForm from "../../components/customer/BookingForm.js";
import { useParams } from "react-router-dom";

const ProfessionalProfile = () => {
  const { id } = useParams();
  const [professional, setProfessional] = useState(null);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proRes, serviceRes] = await Promise.all([
          axios.get(`/api/professionals/${id}`),
          axios.get(`/api/services/by-user/${id}`),
        ]);

        setProfessional(proRes.data.professional);
        setAvailability(proRes.data.availability);
        setServices(serviceRes.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchData();
  }, [id]);

  if (!professional) return <p>Loading...</p>;

  return (
    <div className="professional-profile">
      <h2>{professional.name}</h2>
      <p>{professional.location}</p>

      <h3>Services</h3>
      <ul>
        {services.map((s) => (
          <li key={s._id}>
            <strong>{s.title}</strong> — ${s.price}
            <button onClick={() => setSelectedService(s)}>Book</button>
          </li>
        ))}
      </ul>

      {selectedService && (
        <BookingForm
          professionalId={id}
          service={selectedService}
          availableSlots={availability.flatMap((a) => a.slots)}
          onSuccess={() => setSelectedService(null)}
        />
      )}
    </div>
  );
};

export default ProfessionalProfile;
