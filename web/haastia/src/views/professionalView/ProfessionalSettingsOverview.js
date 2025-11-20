import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authorizedRequest from "../../utils/api";
import {
  extractProfessional,
  resolveLastUpdated,
  resolveProfileUrl,
} from "./utils/profileHelpers";
import "./ProfessionalSettingsOverview.css";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ProfessionalSettingsOverview = () => {
  const [professional, setProfessional] = useState(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await authorizedRequest({
          url: "/api/professional/me/profile",
        });
        const professionalRecord = extractProfessional(payload);
        setProfessional(professionalRecord);
        setProfileUrl(resolveProfileUrl(professionalRecord));
        setLastUpdated(resolveLastUpdated(payload, professionalRecord));
      } catch (err) {
        setError(err.message || "We couldn't load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const lastUpdatedCopy = useMemo(() => formatDate(lastUpdated), [lastUpdated]);
  const businessName =
    professional?.name || professional?.businessName || "Your business";
  const tagline =
    (professional?.tagline && String(professional.tagline)) ||
    "Add a short intro to build trust.";
  const location =
    (professional?.location && String(professional.location)) ||
    (professional?.serviceArea && String(professional.serviceArea)) ||
    "";
  const website = professional?.website ? String(professional.website).trim() : "";
  const cancellationEmail = "team.haastia@gmail.com";
  const cancellationMailto = useMemo(() => {
    const subject = encodeURIComponent("Cancel my Haastia subscription");
    const body = encodeURIComponent(
      "Hi Haastia team,%0D%0A%0D%0AI need to cancel my professional subscription. Please confirm once processed.%0D%0A%0D%0AThanks!"
    );

    return `mailto:${cancellationEmail}?subject=${subject}&body=${body}`;
  }, [cancellationEmail]);

  const handleEditClick = () => {
    navigate("/profile-guidelines");
  };

  return (
    <div className="pro-settings-overview">
      <header className="pro-settings-overview__hero">
        <div>
          <p className="pro-settings-eyebrow">Settings</p>
          <h1>Professional settings</h1>
          <p>
            Review and update the profile, policies, and billing details that
            shape the client experience from one place.
          </p>
        </div>
        <div className="pro-settings-overview__cta">
          <button type="button" onClick={handleEditClick}>
            <span className="pro-settings-overview__cta-icon" aria-hidden="true">
              ✏️
            </span>
            Edit Profile &amp; house rules
          </button>
          {profileUrl && (
            <Link
              to={profileUrl}
              className="pro-overview-preview"
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview public profile ↗
            </Link>
          )}
        </div>
      </header>

      {error && (
        <div className="pro-settings-alert" role="alert">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="pro-settings-overview__loading" aria-live="polite">
          Loading your profile...
        </div>
      )}

      <section className="pro-settings-overview__grid" aria-busy={loading}>
        <article className="pro-overview-card">
          <div className="pro-overview-card__header">
            <div>
              <p className="pro-settings-eyebrow">Business identity</p>
              <h2>{businessName}</h2>
            </div>
            {lastUpdatedCopy && (
              <span className="pro-overview-card__meta">
                Last updated {lastUpdatedCopy}
              </span>
            )}
          </div>

          <dl className="pro-overview-card__details">
            <div>
              <dt>Tagline</dt>
              <dd>{tagline}</dd>
            </div>
            <div>
              <dt>Service area</dt>
              <dd>{location || "Add a service area so locals can find you."}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>
                {website ? (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {website}
                  </a>
                ) : (
                  <span className="pro-overview-empty">
                    Add a portfolio or social link.
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="pro-overview-card">
          <div className="pro-overview-card__header">
            <div>
              <p className="pro-settings-eyebrow">Profile status</p>
              <h2>Ready for bookings</h2>
            </div>
          </div>
          <p className="pro-overview-card__body">
            Make sure your preview link, business info, and house rules match what
            clients experience when they book.
          </p>
          <ul className="pro-overview-checklist">
            <li>
              <span className="pro-overview-check" aria-hidden="true">
                ✓
              </span>
              {profileUrl ? "Public profile link active" : "Add a public profile"}
            </li>
            <li>
              <span className="pro-overview-check" aria-hidden="true">
                ✓
              </span>
              {professional?.profileGuidelines
                ? "House rules published"
                : "House rules missing"}
            </li>
            <li>
              <span className="pro-overview-check" aria-hidden="true">
                ✓
              </span>
              {professional?.tagline ? "Tagline set" : "Add a tagline"}
            </li>
          </ul>
        </article>

        <article className="pro-overview-card pro-overview-card--subscription">
          <div className="pro-overview-card__header">
            <div>
              <p className="pro-settings-eyebrow">Billing &amp; subscription</p>
              <h2>Manage subscription</h2>
            </div>
          </div>
          <p className="pro-overview-card__body">
            You can cancel anytime and you’ll keep access until the end of your billing
            period. We’ll email you a confirmation when the cancellation is processed.
          </p>
          <div className="pro-overview-card__actions">
            <a
              className="pro-overview-card__button"
              href={cancellationMailto}
              rel="noopener noreferrer"
            >
              Email support to cancel
            </a>
            <p className="pro-overview-card__fine-print">
              Prefer to chat? <Link to="/help">Visit the Help Center</Link> for
              more billing resources.
            </p>
          </div>
        </article>

      </section>
    </div>
  );
};

export default ProfessionalSettingsOverview;
