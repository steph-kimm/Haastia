import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getValidToken } from "../../utils/auth";
import authorizedRequest from "../../utils/api";
import "./StripeConnectPage.css";

const mapBooleanToStatus = (value) => {
  if (value === true) return "Complete";
  if (value === false) return "Incomplete";
  return "Unknown";
};

const formatRequirement = (item) => {
  if (typeof item === "string") {
    return item;
  }

  if (!item || typeof item !== "object") {
    return "Additional information required";
  }

  return (
    item.reason ||
    item.code ||
    item.requirement ||
    item.field ||
    "Additional information required"
  );
};

const StripeConnectPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const auth = useMemo(() => getValidToken(), []);
  const userName = auth?.payload?.name || auth?.payload?.email || "there";

  useEffect(() => {
    if (!auth?.token) {
      navigate("/login");
      return;
    }

    const fetchStatus = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await authorizedRequest({
          url: "/api/payment/connect/account-status",
        });
        setStatus(data);
      } catch (err) {
        setError(err.message || "Unable to load your payout status. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [auth, navigate]);

  const openStripeLinkInNewTab = (url) => {
    if (!url) return;
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) {
      newWindow.focus?.();
    } else {
      window.location.assign(url);
    }
  };

  const handleAccountLink = useCallback(async () => {
    try {
      setConnectLoading(true);
      setError("");
      const data = await authorizedRequest({
        url: "/api/payment/connect/account-link",
        method: "post",
      });
      if (data?.url) {
        openStripeLinkInNewTab(data.url);
      } else {
        throw new Error("Stripe did not return a link. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Unable to start Stripe onboarding. Please try again.");
    } finally {
      setConnectLoading(false);
    }
  }, []);

  const handleDashboardLink = useCallback(async () => {
    try {
      setDashboardLoading(true);
      setError("");
      const data = await authorizedRequest({
        url: "/api/payment/connect/login-link",
        method: "post",
      });
      if (data?.url) {
        openStripeLinkInNewTab(data.url);
      } else {
        throw new Error("Stripe did not return a dashboard link. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Unable to open the Stripe dashboard. Please try again.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const requirements = useMemo(() => {
    if (!status) return [];

    if (Array.isArray(status.requirements)) {
      return status.requirements;
    }

    if (status.requirements?.currently_due && Array.isArray(status.requirements.currently_due)) {
      return status.requirements.currently_due;
    }

    if (Array.isArray(status.currently_due)) {
      return status.currently_due;
    }

    if (Array.isArray(status.requirements_due)) {
      return status.requirements_due;
    }

    return [];
  }, [status]);

  const detailsSubmitted = status?.detailsSubmitted ?? status?.details_submitted ?? null;
  const payoutsEnabled = status?.payoutsEnabled ?? status?.payouts_enabled ?? null;
  const chargesEnabled = status?.chargesEnabled ?? status?.charges_enabled ?? null;
  const onboardingComplete = Boolean(
    (detailsSubmitted ?? false) &&
      (payoutsEnabled ?? false) &&
      (chargesEnabled ?? false) &&
      requirements.length === 0
  );
  const outstandingLabel =
    requirements.length === 0 ? "None" : `${requirements.length} remaining`;
  const isConnected = Boolean(detailsSubmitted);

  return (
    <div className="stripe-connect-page">
      <header className="stripe-connect-header">
        <div>
          <p className="stripe-connect-kicker">Professional payouts</p>
          <h1>Stripe Connect</h1>
          <p className="stripe-connect-subtitle">
            Hi {userName}, manage your Stripe onboarding and payouts from this console.
          </p>
        </div>
      </header>

      {error && (
        <div className="stripe-connect-alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="stripe-connect-loading">Checking your Stripe account status...</div>
      ) : (
        <div className="stripe-connect-content">
          <section className="stripe-connect-status">
            <h2>Account status</h2>
            <ul className="stripe-connect-status-list">
              <li>
                <span>Details submitted</span>
                <strong>{mapBooleanToStatus(detailsSubmitted)}</strong>
              </li>
              <li>
                <span>Outstanding requirements</span>
                <strong>{outstandingLabel}</strong>
              </li>
              <li>
                <span>Setup status</span>
                <strong>{onboardingComplete ? "Ready for payouts" : "Action needed"}</strong>
              </li>
            </ul>

            <div className={`stripe-connect-summary ${onboardingComplete ? "success" : "warning"}`}>
              {onboardingComplete ? (
                <p>
                  Your Stripe account is ready to receive payouts. You can use the dashboard to
                  review transfers and update your details at any time.
                </p>
              ) : (
                <p>
                  Your Stripe account still needs attention. Complete the remaining onboarding
                  steps to receive payouts.
                </p>
              )}
            </div>

            {requirements.length > 0 && (
              <div className="stripe-connect-requirements">
                <h3>Next steps</h3>
                <ul>
                  {requirements.map((item, index) => {
                    const text = formatRequirement(item);
                    const key =
                      (typeof item === "string" && item) ||
                      item?.code ||
                      item?.field ||
                      item?.requirement ||
                      item?.reason ||
                      `requirement-${index}`;

                    return <li key={key}>{text}</li>;
                  })}
                </ul>
              </div>
            )}
          </section>

          <section className="stripe-connect-actions">
            <h2>Actions</h2>
            <p>
              Use the buttons below to continue onboarding with Stripe or jump directly into your
              Stripe dashboard.
            </p>
            <div className="stripe-connect-buttons">
              {!isConnected && (
                <button
                  type="button"
                  className="stripe-connect-primary"
                  onClick={handleAccountLink}
                  disabled={connectLoading || loading}
                >
                  {connectLoading ? "Opening Stripe..." : "Connect with Stripe"}
                  <span
                    className="stripe-connect-new-tab-icon"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </button>
              )}
              {isConnected && (
                <button
                  type="button"
                  className="stripe-connect-secondary"
                  onClick={handleDashboardLink}
                  disabled={dashboardLoading || loading}
                >
                  {dashboardLoading ? "Preparing dashboard..." : "Open Stripe Dashboard"}
                  <span
                    className="stripe-connect-new-tab-icon"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default StripeConnectPage;
