import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import authorizedRequest from "../../utils/api";
import "./ProfessionalOnboardingChecklist.css";

const STORAGE_KEY = "haastia.pro.onboarding.shareProfile";
const TOTAL_STEPS = 5;

const getStoredShareCompletion = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch (error) {
    return false;
  }
};

const storeShareCompletion = (value) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch (error) {
    // Intentionally ignore storage errors (e.g., private mode)
  }
};

const normalizeBoolean = (value) => Boolean(value === true || value === "true" || value === 1);

const normalizeGuidelinesValue = (data) => {
  const rawValue =
    data?.profileGuidelines ??
    data?.data?.profileGuidelines ??
    data?.profile?.profileGuidelines ??
    "";

  if (typeof rawValue === "string") {
    return rawValue.trim();
  }

  if (rawValue === null || rawValue === undefined) {
    return "";
  }

  return String(rawValue).trim();
};

const ProfessionalOnboardingChecklist = ({ userId, onNavigate }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState({
    services: false,
    availability: false,
    payouts: false,
    shareProfile: getStoredShareCompletion(),
    profileGuidelines: false,
  });

  const isReadOnly = !userId;

  const completedCount = useMemo(() => {
    return Object.values(steps).filter(Boolean).length;
  }, [steps]);

  const progress = Math.round((completedCount / TOTAL_STEPS) * 100);

  const hasAvailability = (data) => {
    if (!data) return false;

    if (Array.isArray(data)) {
      return data.some((entry) => {
        const slots = Array.isArray(entry?.slots)
          ? entry.slots
          : Array.isArray(entry?.availability)
          ? entry.availability
          : [];
        return Array.isArray(slots) && slots.length > 0;
      });
    }

    if (Array.isArray(data?.availability)) {
      return data.availability.some((entry) => {
        if (!entry) return false;
        if (Array.isArray(entry.slots)) {
          return entry.slots.length > 0;
        }
        if (Array.isArray(entry.times)) {
          return entry.times.length > 0;
        }
        return false;
      });
    }

    if (Array.isArray(data?.data)) {
      return data.data.length > 0;
    }

    return false;
  };

  const hasServices = (data) => {
    if (!data) return false;

    if (Array.isArray(data)) {
      return data.length > 0;
    }

    if (Array.isArray(data?.services)) {
      return data.services.length > 0;
    }

    if (Array.isArray(data?.data)) {
      return data.data.length > 0;
    }

    return false;
  };

  const isStripeComplete = (data) => {
    if (!data || typeof data !== "object") {
      return false;
    }

    const detailsSubmitted = normalizeBoolean(
      data.detailsSubmitted ?? data.details_submitted
    );
    const payoutsEnabled = normalizeBoolean(data.payoutsEnabled ?? data.payouts_enabled);
    const chargesEnabled = normalizeBoolean(data.chargesEnabled ?? data.charges_enabled);

    if (typeof data.requirements === "object" && data.requirements) {
      const currentlyDue = data.requirements.currently_due;
      if (Array.isArray(currentlyDue) && currentlyDue.length > 0) {
        return false;
      }
    }

    if (Array.isArray(data.requirements) && data.requirements.length > 0) {
      return false;
    }

    if (Array.isArray(data.currently_due) && data.currently_due.length > 0) {
      return false;
    }

    return detailsSubmitted && payoutsEnabled && chargesEnabled;
  };

  const fetchData = useCallback(async () => {
    if (!userId) {
      setSteps((prev) => ({
        ...prev,
        services: false,
        availability: false,
        payouts: false,
        profileGuidelines: false,
      }));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [servicesResponse, availabilityResponse, stripeResponse, profileResponse] = await Promise.all([
        authorizedRequest({ url: "/api/services/my-services" }),
        authorizedRequest({ url: `/api/availability/${userId}` }),
        authorizedRequest({ url: "/api/payment/connect/account-status" }),
        authorizedRequest({ url: "/api/professional/me/profile" }),
      ]);

      const guidelinesValue = normalizeGuidelinesValue(profileResponse);

      setSteps((prev) => ({
        ...prev,
        services: hasServices(servicesResponse),
        availability: hasAvailability(availabilityResponse),
        payouts: isStripeComplete(stripeResponse),
        profileGuidelines: guidelinesValue.length > 0,
      }));
    } catch (err) {
      setError(err.message || "We couldn\'t load your onboarding progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.pathname]);

  useEffect(() => {
    storeShareCompletion(steps.shareProfile);
  }, [steps.shareProfile]);

  const handleNavigate = useCallback(
    (path) => {
      if (typeof onNavigate === "function") {
        onNavigate(path || null);
      }
    },
    [onNavigate]
  );

  const handleShareProfile = useCallback(() => {
    if (!userId) {
      setSteps((prev) => ({ ...prev, shareProfile: true }));
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const profileUrl = `${origin}/professional/${userId}`;

    if (origin) {
      window.open(profileUrl, "_blank", "noopener,noreferrer");
    }

    if (navigator?.clipboard?.writeText && profileUrl) {
      navigator.clipboard.writeText(profileUrl).catch(() => {
        /* Ignore clipboard errors */
      });
    }
    setSteps((prev) => ({ ...prev, shareProfile: true }));
    handleNavigate(null);
  }, [handleNavigate, userId]);

  const handleRetry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const stepsConfig = useMemo(
    () => [
      {
        id: "services",
        title: "List your first service",
        description: "Add a service so customers know what you offer.",
        cta: "Add service",
        onClick: () => handleNavigate("/add-service"),
        completed: steps.services,
      },
      {
        id: "profileGuidelines",
        title: "Publish your house rules",
        description:
          "Use professional settings to share prep steps and booking policies.",
        cta: "Open professional settings",
        onClick: () => handleNavigate("/pro/settings"),
        completed: steps.profileGuidelines,
      },
      {
        id: "availability",
        title: "Set your availability",
        description: "Choose when clients can book time with you.",
        cta: "Set availability",
        onClick: () => handleNavigate("/availability"),
        completed: steps.availability,
      },
      {
        id: "payouts",
        title: "Enable payouts",
        description: "Connect Stripe to receive client payments.",
        cta: "Connect payouts",
        onClick: () => handleNavigate("/payments/connect"),
        completed: steps.payouts,
      },
      {
        id: "shareProfile",
        title: "Share your profile",
        description: "Send your public link to potential clients.",
        cta: "Copy profile link",
        onClick: handleShareProfile,
        completed: steps.shareProfile,
      },
    ],
    [
      handleNavigate,
      handleShareProfile,
      steps.availability,
      steps.payouts,
      steps.profileGuidelines,
      steps.services,
      steps.shareProfile,
    ]
  );

  return (
    <section className="pro-onboarding-card" aria-live="polite">
      <div className="pro-onboarding-card__header">
        <h3>Complete your profile</h3>
        <p>{completedCount} of {TOTAL_STEPS} steps completed</p>
      </div>

      <div className="pro-onboarding-card__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="pro-onboarding-card__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {isReadOnly && (
        <p className="pro-onboarding-card__hint">
          Sign in to track these tasks automatically.
        </p>
      )}

      {error && (
        <div className="pro-onboarding-card__alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={handleRetry} className="pro-onboarding-card__retry">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="pro-onboarding-card__loading">Checking your onboarding status...</div>
      ) : (
        <ul className="pro-onboarding-card__steps">
          {stepsConfig.map((step) => (
            <li key={step.id} className={`pro-onboarding-card__step${step.completed ? " is-complete" : ""}`}>
              <div className="pro-onboarding-card__step-main">
                <span className="pro-onboarding-card__step-status" aria-hidden="true">
                  {step.completed ? "✓" : step.id === "shareProfile" && !userId ? "-" : ""}
                </span>
                <div>
                  <p className="pro-onboarding-card__step-title">{step.title}</p>
                  <p className="pro-onboarding-card__step-description">{step.description}</p>
                </div>
              </div>
              <button
                type="button"
                className="pro-onboarding-card__step-action"
                onClick={step.onClick}
                disabled={step.completed || loading}
              >
                {step.completed ? "Completed" : step.cta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

ProfessionalOnboardingChecklist.propTypes = {
  userId: PropTypes.string,
  onNavigate: PropTypes.func,
};

ProfessionalOnboardingChecklist.defaultProps = {
  userId: null,
  onNavigate: undefined,
};

export default ProfessionalOnboardingChecklist;
