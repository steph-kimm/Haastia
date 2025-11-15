import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import authorizedRequest from "../../utils/api";
import "./ProfessionalGuidelines.css";

const MAX_LENGTH = 1500;

const normalizeGuidelines = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const ProfessionalGuidelines = () => {
  const [guidelines, setGuidelines] = useState("");
  const [initialGuidelines, setInitialGuidelines] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const profile = await authorizedRequest({
        url: "/api/professional/me/profile",
      });

      const profileGuidelines = normalizeGuidelines(
        profile?.profileGuidelines ?? profile?.data?.profileGuidelines ?? ""
      ).slice(0, MAX_LENGTH);

      setGuidelines(profileGuidelines);
      setInitialGuidelines(profileGuidelines);
    } catch (err) {
      setError(err.message || "We couldn't load your profile guidelines.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const trimmedGuidelines = useMemo(() => guidelines.trim(), [guidelines]);
  const isDirty = guidelines !== initialGuidelines;

  const validate = () => {
    if (!trimmedGuidelines) {
      setError("Please enter your house rules before saving.");
      return false;
    }

    if (trimmedGuidelines.length > MAX_LENGTH) {
      setError(`Keep your notes under ${MAX_LENGTH} characters.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      await authorizedRequest({
        url: "/api/professional/me/profile",
        method: "put",
        data: { profileGuidelines: trimmedGuidelines },
      });

      setInitialGuidelines(trimmedGuidelines);
      setSuccess("Your house rules were saved.");
    } catch (err) {
      setError(err.message || "We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remainingCharacters = Math.max(0, MAX_LENGTH - trimmedGuidelines.length);

  return (
    <div className="pro-guidelines-page">
      <div className="pro-guidelines-card">
        <header className="pro-guidelines-card__header">
          <span className="pro-guidelines-card__eyebrow">Set expectations</span>
          <h1>House rules & before-you-book notes</h1>
          <p>
            Share helpful context with new clients—arrival details, prep work, or anything
            that keeps appointments running smoothly. This copy shows on your public profile.
          </p>
        </header>

        {error && (
          <div className="pro-guidelines-card__alert" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="pro-guidelines-card__success" role="status">
            <p>{success}</p>
            <Link to="/onboarding">Back to onboarding</Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pro-guidelines-form">
          <label htmlFor="profile-guidelines">Set house rules / before-you-book notes</label>
          <p className="pro-guidelines-form__hint">
            Clients will see this right before booking. Keep it friendly but clear (think 2-3
            short paragraphs).
          </p>

          <textarea
            id="profile-guidelines"
            name="profile-guidelines"
            value={guidelines}
            onChange={(event) => {
              setGuidelines(event.target.value.slice(0, MAX_LENGTH));
              setError("");
              setSuccess("");
            }}
            disabled={loading || saving}
            placeholder={
              loading
                ? "Loading your existing notes..."
                : "Example: Parking is available on 5th Ave. Please arrive 10 minutes early and bring any project files in PDF."
            }
            rows={10}
          />

          <div className="pro-guidelines-form__meta">
            <span>{remainingCharacters} characters left</span>
            {isDirty && !loading && (
              <span className="pro-guidelines-form__dirty-indicator">Unsaved changes</span>
            )}
          </div>

          <button type="submit" disabled={saving || loading}>
            {saving ? "Saving..." : "Save guidelines"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalGuidelines;
