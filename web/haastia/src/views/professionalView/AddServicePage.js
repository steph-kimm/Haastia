import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddNewServiceForm from "../../components/professional/NewServiceForm/AddNewServiceForm";
import "./add-service.css";

const AddServicePage = () => {
  const [lastService, setLastService] = useState(null);
  const navigate = useNavigate();

  const handleSuccess = (created) => {
    setLastService(created);
  };

  const resetForAnother = () => {
    setLastService(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="add-svc-page">
      <div className="page-inner">
        <header className="add-svc-header">
          <span className="eyebrow">Create something clients will love</span>
          <h1>Add a New Service</h1>
          <p className="sub">Share the essentials so clients know exactly what to expect.</p>
        </header>

        {!lastService ? (
          <section className="form-section">
            <AddNewServiceForm onSuccess={handleSuccess} />
          </section>
        ) : (
          <section className="card success-card">
            <div className="success-icon">✓</div>
            <h2>Service added successfully!</h2>
            <p className="muted">
              {lastService?.title ? `"${lastService.title}"` : "Your service"} is now live.
            </p>

            <div className="cta-row">
              <button className="btn-primary" onClick={() => navigate("/services")}>
                View My Services
              </button>
              <button className="btn-ghost" onClick={resetForAnother}>
                Add Another Service
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AddServicePage;
