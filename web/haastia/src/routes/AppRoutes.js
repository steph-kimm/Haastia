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

  // Decode token once at startup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role);

      // automatically set professional view if user is professional
      if (decoded.role === "professional") {
        setCurrentView("professional");
      }
    }
  }, [setCurrentView]);

  // wait for ViewContext to sync
  if (!currentView && !userRole) return <div>Loading...</div>;

  return (
    <>
      {currentView === "customer" && (
        <>
          <Navbar />
          <CustomerRoutes />
        </>
      )}

      {(currentView === "professional" || userRole === "professional") && (
        <>
          <ProfessionalNavbar />
          <ProfessionalRoutes />
        </>
      )}

      {currentView === "admin" && (
        <>
          <AdminRoutes />
        </>
      )}
    </>
  );
}

export default AppRoutes;
