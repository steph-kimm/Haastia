// ProfessionalProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingForm from "../../components/customer/BookingForm.js";
import { useParams } from "react-router-dom";
import Modal from "../modal/Modal.js";
import "./ProfessionalProfile.css"; // keep your page styles

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const getRatingValue = (rating) => {
  if (!rating) return null;
  if (typeof rating === "number") return rating;
  if (typeof rating === "string") return parseFloat(rating);
  if (rating?.$numberDecimal) return parseFloat(rating.$numberDecimal);
  return null;
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value)
  );
};

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
          axios.get(`http://localhost:8000/api/professional/${id}`),
          axios.get(`http://localhost:8000/api/services/by-user/${id}`),
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

  const ratingValue = getRatingValue(professional.rating);
  const formattedRating =
    typeof ratingValue === "number" && !Number.isNaN(ratingValue)
      ? ratingValue.toFixed(1)
      : null;

  const jobsCompleted = professional.jobs_done ?? professional.jobsDone ?? 0;
  const profileImage = professional?.image?.url || FALLBACK_AVATAR;
  const locationLabel = professional.location?.trim() || "Location TBD";
  const firstName = professional.name?.split(" ")[0] || "This professional";
  const hasCustomName = firstName !== "This professional";
  const rawGuidelines = professional.profileGuidelines;
  const profileGuidelines =
    typeof rawGuidelines === "string"
      ? rawGuidelines.trim()
      : rawGuidelines
      ? String(rawGuidelines).trim()
      : "";
  const guidelineParagraphs = profileGuidelines
    ? profileGuidelines
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="professional-profile">
      <section className="profile-hero">
        <div className="profile-card">
          <div className="profile-avatar">
            <img src={profileImage} alt={`${professional.name} profile`} />
          </div>
          <div className="profile-meta">
            <span className="profile-label">Professional</span>
            <h2>{professional.name}</h2>
            <p className="profile-location">{locationLabel}</p>
            <div className="profile-stats">
              <div>
                <span className="stat-title">Rating</span>
                <span className="stat-value">
                  {formattedRating && ratingValue > 0 ? `${formattedRating}/5` : "New"}
                </span>
              </div>
              <div>
                <span className="stat-title">Jobs</span>
                <span className="stat-value">{jobsCompleted}</span>
              </div>
              {professional.email && (
                <div>
                  <span className="stat-title">Contact</span>
                  <span className="stat-value">{professional.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {guidelineParagraphs.length > 0 && (
        <section className="guidelines-section">
          <div className="section-heading">
            <div>
              <h3>Before you book</h3>
              <p className="section-subtitle">
                A few helpful notes from {hasCustomName ? firstName : "this professional"} to
                make sure everything goes smoothly.
              </p>
            </div>
          </div>
          <div className="guidelines-content">
            {guidelineParagraphs.map((paragraph, index) => {
              const lines = paragraph.split(/\n+/);
              return (
                <p key={`guideline-${index}`}>
                  {lines.map((line, lineIndex) => (
                    <React.Fragment key={`guideline-${index}-line-${lineIndex}`}>
                      {line}
                      {lineIndex < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
          </div>
        </section>
      )}

      <section className="services-section">
        <div className="section-heading">
          <div>
            <h3>Services</h3>
            <p className="section-subtitle">
              Choose the service that best fits your needs and book instantly.
            </p>
          </div>
        </div>
        <ul className="services-grid">
          {services.map((s) => (
            <li key={s._id} className="service-card">
              <div className="service-card__body">
                <strong>{s.title}</strong>
                {s.description && <p className="service-description">{s.description}</p>}
              </div>
              <div className="service-card__footer">
                <div className="price-line">
                  <div className="price-breakdown">
                    <p className="price">{formatCurrency(s.price)}</p>
                    <p className="deposit">
                      {s.deposit && s.deposit > 0
                        ? `${formatCurrency(s.deposit)} deposit`
                        : "No deposit required"}
                    </p>
                  </div>
                  {s.duration && <p className="duration">· {s.duration} min</p>}
                </div>
                <button onClick={() => setSelectedService(s)}>Book service</button>
              </div>
            </li>
          ))}
          {services.length === 0 && (
            <li className="service-card empty-state">
              <div className="service-card__body">
                <strong>No services listed yet</strong>
                <p className="service-description">
                  Check back soon to discover what {firstName} offers.
                </p>
              </div>
            </li>
          )}
        </ul>
      </section>

      {/* Booking Modal */}
      <Modal
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={selectedService ? `Book: ${selectedService.title}` : "Book service"}
      >
        {selectedService && (
          <BookingForm
            professionalId={id}
            service={selectedService}
            availability={availability}
            onSuccess={() => setSelectedService(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProfessionalProfile;
