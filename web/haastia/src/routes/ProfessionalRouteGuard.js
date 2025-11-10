import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useView } from "../context/ViewContext";

const ALLOWED_VIEWS = new Set(["professional", "admin"]);

const ProfessionalRouteGuard = ({ children }) => {
  const { currentView } = useView();
  const navigate = useNavigate();

  const isLoading = currentView === null;
  const isAllowed = ALLOWED_VIEWS.has(currentView);

  useEffect(() => {
    if (isLoading || isAllowed) {
      return;
    }

    const timeout = setTimeout(() => {
      navigate("/");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isAllowed, isLoading, navigate]);

  if (isLoading) {
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

