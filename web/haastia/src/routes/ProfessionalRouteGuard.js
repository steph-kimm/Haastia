import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useView } from "../context/ViewContext";
import { getValidToken } from "../utils/auth";

const ALLOWED_VIEWS = new Set(["professional", "admin"]);

const ProfessionalRouteGuard = ({ children }) => {
  const { currentView, setCurrentView } = useView();
  const navigate = useNavigate();

  const auth = getValidToken();
  const role = auth?.payload?.role;
  const isProfessionalRole = role === "professional" || role === "admin";
  const isAllowedView = ALLOWED_VIEWS.has(currentView);
  const isAllowed = isProfessionalRole || isAllowedView;
  const shouldSyncView =
    isProfessionalRole && !isAllowedView && role !== undefined;

  useEffect(() => {
    if (!shouldSyncView) {
      return;
    }

    setCurrentView(role === "admin" ? "admin" : "professional");
  }, [role, setCurrentView, shouldSyncView]);

  useEffect(() => {
    if (isAllowed) {
      return;
    }

    const timeout = setTimeout(() => {
      navigate("/");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isAllowed, navigate]);

  if (shouldSyncView) {
    return <div>Loading...</div>;
  }

  if (isAllowed) {
    return children ?? null;
  }

  return (
    <div className="professional-only-message" role="alert">
      this is a page for professionals
    </div>
  );
};

export default ProfessionalRouteGuard;

