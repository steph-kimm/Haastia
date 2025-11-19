import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authorizedRequest from "../../utils/api";
import {
  extractProfessional,
  normalizeGuidelines,
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

  const guidelinesPreview = useMemo(() => {
    const copy = normalizeGuidelines(
      professional?.profileGuidelines ?? professional?.houseRules
    ).trim();

    if (!copy) return "";
    if (copy.length > 240) {
      return `${copy.slice(0, 237)}…`;
    }

    return copy;
  }, [professional]);

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

  const handleEditClick = () => {
    navigate("/profile-guidelines");
  };

  return (
    <div className="pro-settings-overview">
      <header className="pro-settings-overview__hero">
        <div>
          <p className="pro-settings-eyebrow">Profile</p>
          <h1>Profile & house rules overview</h1>
          <p>
            Keep a pulse on what clients see before you edit. Update copy,
            expectations, and helpful links in one place.
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

        <article className="pro-overview-card pro-overview-card--guidelines">
          <div className="pro-overview-card__header">
            <div>
              <p className="pro-settings-eyebrow">House rules preview</p>
              <h2>What clients read before booking</h2>
            </div>
          </div>
          {guidelinesPreview ? (
            <p className="pro-overview-card__body">{guidelinesPreview}</p>
          ) : (
            <p className="pro-overview-empty">
              Share parking info, prep steps, and policies so clients feel ready
              to book.
            </p>
          )}
        </article>
      </section>
    </div>
  );
};

export default ProfessionalSettingsOverview;
