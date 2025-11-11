import React, { useEffect } from "react";
import { useView } from "../context/ViewContext";
import CustomerRoutes from "./CustomerRoutes";
import ProfessionalRoutes from "./ProfessionalRoutes";
import AdminRoutes from "./AdminRoutes";
import Navbar from "../components/Navbar";
import ProfessionalNavbar from "../components/professional/ProfessionalNavbar";
import { getValidToken } from "../utils/auth";
import "./AppRoutes.css";

function AppRoutes() {
  const { currentView, setCurrentView } = useView();

  // Detect role from token and adjust context
  useEffect(() => {
    const auth = getValidToken();
    if (!auth) {
      setCurrentView("customer");
      return;
    }

    const role = auth.payload?.role;
    if (role === "professional") {
      setCurrentView("professional");
      return;
    }

    if (role === "admin") {
      setCurrentView("admin");
      return;
    }

    setCurrentView("customer");
  }, [setCurrentView]);

  // Only render one section at a time
  if (!currentView) return <div>Loading...</div>;

  if (currentView === "professional") {
    return (
      <div className="professional-app-shell">
        <ProfessionalNavbar />
        <main className="professional-app-shell__content">
          <ProfessionalRoutes />
        </main>
      </div>
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