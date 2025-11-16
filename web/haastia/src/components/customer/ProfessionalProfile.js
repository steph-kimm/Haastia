// ProfessionalProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingForm from "../../components/customer/BookingForm.js";
import { useParams } from "react-router-dom";
import Modal from "../modal/Modal.js";
import "./ProfessionalProfile.css"; // keep your page styles

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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
          axios.get(`/api/professional/${id}`),
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

  const profileImage = professional?.image?.url || FALLBACK_AVATAR;
  const locationLabel = professional.location?.trim() || "Location TBD";
  const firstName = professional.name?.split(" ")[0] || "This professional";
  const hasCustomName = firstName !== "This professional";
  const canAcceptPayments = Boolean(
    professional?.stripeConnectStatus?.chargesEnabled
  );
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
  const hasServices = services.length > 0;
  const heroSubtitle =
    professional?.tagline?.trim() ||
    professional?.shortDescription?.trim() ||
    `Ready to book ${hasServices ? "services" : "time"} with a Neighborly pro in ${
      locationLabel !== "Location TBD" ? locationLabel : "your area"
    }.`;
  const aboutCopy =
    professional?.bio?.trim() ||
    professional?.about?.trim() ||
    `Expect a collaborative, transparent experience from ${
      hasCustomName ? firstName : "this professional"
    } with updates before, during, and after your appointment.`;
  const contactNote =
    professional?.schedulingNote?.trim() ||
    "Have questions before you book? Reach out and they'll get back quickly.";
  const heroPrimaryDisabled = !canAcceptPayments || !hasServices;
  const heroPrimaryLabel = heroPrimaryDisabled
    ? canAcceptPayments
      ? "Services coming soon"
      : "Payments unavailable"
    : `Book ${services[0].title}`;
  const handleScrollToServices = () => {
    const section = document.getElementById("services-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const handlePrimaryCTA = () => {
    if (heroPrimaryDisabled) return;
    setSelectedService(services[0]);
  };

  return (
    <div className="professional-profile">
      <section className="profile-cover">
        <div className="cover-media">
          <img src={profileImage} alt={`${professional.name} profile`} />
        </div>
        <div className="cover-copy">
          <span className="eyebrow-tag">Neighborly Pro</span>
          <h1>{professional.name}</h1>
          <p className="cover-lead">{heroSubtitle}</p>
          <p className="cover-location">
            Based in <strong>{locationLabel}</strong>
          </p>
          <div className="cover-actions">
            {hasServices && (
              <button
                type="button"
                className="primary-cta"
                onClick={handlePrimaryCTA}
                disabled={heroPrimaryDisabled}
              >
                {heroPrimaryLabel}
              </button>
            )}
            <button type="button" className="secondary-cta" onClick={handleScrollToServices}>
              See services
            </button>
          </div>
        </div>
      </section>

      <section className="profile-story">
        <article className="story-card">
          <h3>About {hasCustomName ? firstName : "this pro"}</h3>
          <p>{aboutCopy}</p>
        </article>
        <article className="story-card contact-card">
          <h4>Reach out</h4>
          <p>{contactNote}</p>
          {professional.email && (
            <a className="contact-link" href={`mailto:${professional.email}`}>
              {professional.email}
            </a>
          )}
        </article>
      </section>

      {guidelineParagraphs.length > 0 && (
        <section className="profile-guidelines">
          <header>
            <span className="eyebrow-tag">Before you book</span>
            <h3>Helpful notes</h3>
          </header>
          <div className="guideline-list">
            {guidelineParagraphs.map((paragraph, index) => {
              const lines = paragraph.split(/\n+/);
              return (
                <article key={`guideline-${index}`}>
                  <p>
                    {lines.map((line, lineIndex) => (
                      <React.Fragment key={`guideline-${index}-line-${lineIndex}`}>
                        {line}
                        {lineIndex < lines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section id="services-section" className="services-list">
        <header>
          <span className="eyebrow-tag">Services</span>
          <h3>Book time with {hasCustomName ? firstName : "this pro"}</h3>
          <p>
            Select what fits your project. You’ll get a confirmation email with next steps
            as soon as it’s booked.
          </p>
        </header>
        <ul>
          {services.map((s) => (
            <li key={s._id} className="service-row">
              <div>
                <h4>{s.title}</h4>
                {s.description && <p>{s.description}</p>}
                <div className="service-meta">
                  <span>{formatCurrency(s.price)}</span>
                  <span>
                    {s.deposit && s.deposit > 0
                      ? `${formatCurrency(s.deposit)} deposit`
                      : "No deposit required"}
                  </span>
                  {s.duration && <span>{s.duration} min</span>}
                </div>
              </div>
              <button
                type="button"
                className="book-service-btn"
                onClick={() => canAcceptPayments && setSelectedService(s)}
                disabled={!canAcceptPayments}
                title={
                  canAcceptPayments ? undefined : "This professional can't accept payments yet."
                }
              >
                {canAcceptPayments ? "Book service" : "Payments unavailable"}
              </button>
            </li>
          ))}
          {services.length === 0 && (
            <li className="service-row empty-state">
              <h4>No services yet</h4>
              <p>
                Check back soon to see what {hasCustomName ? firstName : "this professional"} offers.
              </p>
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
            canAcceptPayments={canAcceptPayments}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProfessionalProfile;
