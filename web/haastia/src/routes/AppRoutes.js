import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useView } from "../context/ViewContext";
import CustomerRoutes from "./CustomerRoutes";
import ProfessionalRoutes from "./ProfessionalRoutes";
import AdminRoutes from "./AdminRoutes";
import Navbar from "../components/Navbar";
import ProfessionalNavbar from "../components/professional/ProfessionalNavbar";
import { getValidToken } from "../utils/auth";

function AppRoutes() {
  const { currentView, setCurrentView } = useView();
  const navigate = useNavigate();

  // Detect role from token and adjust context
  useEffect(() => {
    const auth = getValidToken();
    if (!auth) {
      setCurrentView("customer");
      navigate("/login");
      return;
    }

    const role = auth.payload?.role;
    if (role === "professional") {
      setCurrentView("professional");
    }
  }, [navigate, setCurrentView]);

  // Only render one section at a time
  if (!currentView) return <div>Loading...</div>;

  if (currentView === "professional") {
    return (
      <>
        <ProfessionalNavbar />
        <ProfessionalRoutes />
      </>
    );
  }

  if (currentView === "admin") {
    return (
      <>
        {/* Add your AdminNavbar when ready */}
        <AdminRoutes />
      </>
    );
  }

  // Default (customer)
  return (
    <>
      <Navbar />
      <CustomerRoutes />
    </>
  );
}

export default AppRoutes;