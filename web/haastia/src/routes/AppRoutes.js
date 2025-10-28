import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useView } from "../context/ViewContext";
import CustomerRoutes from "./CustomerRoutes";
import ProfessionalRoutes from "./ProfessionalRoutes";
import AdminRoutes from "./AdminRoutes";
import Navbar from "../components/Navbar";
import ProfessionalNavbar from "../components/professional/ProfessionalNavbar";

function AppRoutes() {
  const { currentView, setCurrentView } = useView();
  const [userRole, setUserRole] = useState(null);

  // Detect role from token and adjust context
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role);
      if (decoded.role === "professional") {
        setCurrentView("professional");
      }
    }
  }, [setCurrentView]);

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