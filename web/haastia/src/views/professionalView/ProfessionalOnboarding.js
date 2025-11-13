import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import ProfessionalOnboardingChecklist from "../../components/professional/ProfessionalOnboardingChecklist";
import { getValidToken } from "../../utils/auth";

import "./ProfessionalOnboarding.css";

const ProfessionalOnboarding = () => {
  const navigate = useNavigate();
  const auth = getValidToken();

  const userId = useMemo(() => {
    const payload = auth?.payload ?? null;
    return payload?._id || payload?.id || null;
  }, [auth]);

  const handleNavigate = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="pro-onboarding-page">
      <header className="pro-onboarding-page__header">
        <span className="pro-onboarding-page__eyebrow">Get set up</span>
        <h1>Finish getting your account ready</h1>
        <p className="pro-onboarding-page__lead">
          Work through the checklist below to make your profile discoverable,
          open your calendar to clients, and accept payments without delay.
        </p>
      </header>

      <div className="pro-onboarding-page__body">
        <ProfessionalOnboardingChecklist
          userId={userId}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
};

export default ProfessionalOnboarding;
