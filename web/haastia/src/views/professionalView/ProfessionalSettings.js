import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import authorizedRequest from "../../utils/api";
import "./ProfessionalSettings.css";

const GUIDELINES_MAX_LENGTH = 1500;

const FIELD_LIMITS = {
  tagline: 120,
  bio: 2000,
  businessAddress: 200,
  location: 120,
  contactPhone: 32,
  profileGuidelines: GUIDELINES_MAX_LENGTH,
};

const EXTRA_FIELDS = ["website"];
const FORM_FIELDS = [...Object.keys(FIELD_LIMITS), ...EXTRA_FIELDS];

const EMPTY_FORM = FORM_FIELDS.reduce(
  (acc, field) => ({ ...acc, [field]: "" }),
  {}
);

const extractProfessional = (payload) => {
  if (!payload) return {};
  if (payload.professional) return payload.professional;
  if (payload.data?.professional) return payload.data.professional;
  return payload;
};

const normalizeGuidelines = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const ProfessionalSettings = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [professionalName, setProfessionalName] = useState("");

  const applyProfile = useCallback((payload) => {
    const professional = extractProfessional(payload);
    const nextForm = FORM_FIELDS.reduce((acc, field) => {
      let value =
        professional?.[field] ??
        payload?.[field] ??
        payload?.data?.[field] ??
        "";

      if (field === "profileGuidelines") {
        value = normalizeGuidelines(value).slice(0, GUIDELINES_MAX_LENGTH);
      } else if (value === null || value === undefined) {
        value = "";
      } else if (typeof value !== "string") {
        value = String(value);
      }

      return {
        ...acc,
        [field]: value,
      };
    }, {});

    setForm(nextForm);
    setInitialForm(nextForm);
    setProfessionalName(professional?.name || "");
    setProfileUrl(
      professional?._id ? `/professional/${professional._id}` : ""
    );
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await authorizedRequest({
        url: "/api/professional/me/profile",
      });
      applyProfile(payload);
    } catch (err) {
      setError(err.message || "We couldn't load your settings.");
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const dirtyFields = useMemo(
    () =>
      Object.keys(form).filter((field) => form[field] !== initialForm[field]),
    [form, initialForm]
  );
  const hasChanges = dirtyFields.length > 0;

  const handleInputChange = (field) => (event) => {
    setError("");
    setSuccess("");
    const limit = FIELD_LIMITS[field];
    const incomingValue = event.target.value;
    const nextValue =
      typeof limit === "number" ? incomingValue.slice(0, limit) : incomingValue;
    setForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!hasChanges) {
      setError("No changes to save yet.");
      return;
    }

    const trimmedGuidelinesValue = form.profileGuidelines.trim();
    if (
      dirtyFields.includes("profileGuidelines") &&
      !trimmedGuidelinesValue
    ) {
      setError("Please enter your house rules before saving.");
      return;
    }

    try {
      setSaving(true);
      const payload = dirtyFields.reduce((acc, field) => {
        const nextValue =
          field === "profileGuidelines"
            ? trimmedGuidelinesValue
            : form[field];
        return { ...acc, [field]: nextValue };
      }, {});

      const response = await authorizedRequest({
        url: "/api/professional/me/profile",
        method: "put",
        data: payload,
      });

      applyProfile(response);
      setSuccess("Profile settings saved.");
    } catch (err) {
      setError(
        err.message || "We couldn't save your changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderCounter = (field) => {
    const limit = FIELD_LIMITS[field];
    if (!limit) return null;
    const remaining = Math.max(0, limit - form[field].length);
    return (
      <span className="pro-settings-field__counter">{remaining} left</span>
    );
  };

  const guidelinesRemaining = Math.max(
    0,
    GUIDELINES_MAX_LENGTH - form.profileGuidelines.length
  );
  const guidelinesDirty =
    form.profileGuidelines !== initialForm.profileGuidelines;

  return (
    <div className="pro-settings-page">
      <header className="pro-settings-header">
        <div>
          <p className="pro-settings-eyebrow">Profile</p>
          <h1>
            {professionalName
              ? `${professionalName} · Profile & house rules`
              : "Profile & house rules"}
          </h1>
          <p>
            Keep your business info and house rules up to date so clients know
            what to expect before booking.
          </p>
        </div>
        {profileUrl && (
          <Link
            to={profileUrl}
            className="pro-settings-preview"
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview public profile ↗
          </Link>
        )}
      </header>

      {error && (
        <div className="pro-settings-alert" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="pro-settings-success" role="status">
          {success}
        </div>
      )}

      <form className="pro-settings-grid" onSubmit={handleSubmit}>
        <section className="pro-settings-card">
          <div className="pro-settings-card__header">
            <div>
              <p className="pro-settings-eyebrow">Public profile</p>
              <h2>Tell clients what you do</h2>
            </div>
            {renderCounter("tagline")}
          </div>

          <label htmlFor="professional-tagline">Headline</label>
          <p className="pro-settings-hint">
            This short line appears near your name on profile and booking pages.
          </p>
          <input
            id="professional-tagline"
            name="professional-tagline"
            value={form.tagline}
            onChange={handleInputChange("tagline")}
            disabled={loading || saving}
            placeholder="Example: Mobile esthetician serving downtown"
          />

          <label htmlFor="professional-bio">About / description</label>
          <p className="pro-settings-hint">
            Share your specialties, certifications, or what makes your service
            unique.
          </p>
          <textarea
            id="professional-bio"
            name="professional-bio"
            rows={6}
            value={form.bio}
            onChange={handleInputChange("bio")}
            disabled={loading || saving}
            placeholder="Tell clients about your experience, favorite projects, or what to expect."
          />
          <div className="pro-settings-card__footer">{renderCounter("bio")}</div>
        </section>

        <section className="pro-settings-card">
          <div className="pro-settings-card__header">
            <div>
              <p className="pro-settings-eyebrow">Business details</p>
              <h2>How and where you work</h2>
            </div>
          </div>

          <div className="pro-settings-field">
            <label htmlFor="professional-location">Service area</label>
            <p className="pro-settings-hint">
              Example: Neighborhoods or cities you cover.
            </p>
            <input
              id="professional-location"
              name="professional-location"
              value={form.location}
              onChange={handleInputChange("location")}
              disabled={loading || saving}
              placeholder="Greater Seattle, remote consults, etc."
            />
            {renderCounter("location")}
          </div>

          <div className="pro-settings-field">
            <label htmlFor="professional-address">Business address</label>
            <p className="pro-settings-hint">
              Shown privately to clients after booking if you host appointments.
            </p>
            <input
              id="professional-address"
              name="professional-address"
              value={form.businessAddress}
              onChange={handleInputChange("businessAddress")}
              disabled={loading || saving}
              placeholder="123 Market Street, Suite 4"
            />
            {renderCounter("businessAddress")}
          </div>

          <div className="pro-settings-duo">
            <div className="pro-settings-field">
              <label htmlFor="professional-phone">Contact phone</label>
              <input
                id="professional-phone"
                name="professional-phone"
                value={form.contactPhone}
                onChange={handleInputChange("contactPhone")}
                disabled={loading || saving}
                placeholder="(555) 123-4567"
              />
              {renderCounter("contactPhone")}
            </div>
            <div className="pro-settings-field">
              <label htmlFor="professional-website">Website or portfolio</label>
              <input
                id="professional-website"
                name="professional-website"
                value={form.website}
                onChange={handleInputChange("website")}
                disabled={loading || saving}
                placeholder="https://yourstudio.com"
              />
              {renderCounter("website")}
            </div>
          </div>
        </section>

        <section className="pro-settings-card pro-settings-guidelines">
          <div className="pro-settings-card__header">
            <div>
              <p className="pro-settings-eyebrow">Set expectations</p>
              <h2>House rules & before-you-book notes</h2>
              <p className="pro-settings-hint">
                Share prep steps, arrival tips, and policies. This copy lives on
                your public profile and booking flow.
              </p>
            </div>
          </div>
          <label htmlFor="professional-house-rules">
            Set house rules / before-you-book notes
          </label>
          <p className="pro-settings-hint">
            Clients will see this right before booking. Keep it friendly but
            clear (think 2-3 short paragraphs).
          </p>

          <textarea
            id="professional-house-rules"
            name="professional-house-rules"
            value={form.profileGuidelines}
            onChange={handleInputChange("profileGuidelines")}
            disabled={loading || saving}
            placeholder={
              loading
                ? "Loading your existing notes..."
                : "Example: Parking is available on 5th Ave. Please arrive 10 minutes early and bring any project files in PDF."
            }
            rows={8}
          />

          <div className="pro-settings-guidelines__meta">
            <span>{guidelinesRemaining} characters left</span>
            {guidelinesDirty && !loading && (
              <span className="pro-settings-guidelines__dirty">Unsaved changes</span>
            )}
          </div>
        </section>

        <div className="pro-settings-actions">
          <button type="submit" disabled={!hasChanges || saving || loading}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {hasChanges && !saving && (
            <span className="pro-settings-unsaved">Unsaved changes</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfessionalSettings;
