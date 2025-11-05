import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useView } from "../context/ViewContext";
import CustomerRoutes from "./CustomerRoutes";
import ProfessionalRoutes from "./ProfessionalRoutes";
import AdminRoutes from "./AdminRoutes";
import Navbar from "../components/Navbar";
import ProfessionalNavbar from "../components/professional/ProfessionalNavbar";
import { getValidToken } from "../utils/auth";
import { professionalRouteConfig } from "./routeConfig";

function AppRoutes() {
  const { currentView, setCurrentView } = useView();
  const navigate = useNavigate();
  const location = useLocation();

  const protectedPathSet = React.useMemo(
    () =>
      new Set(
        professionalRouteConfig.map(({ path }) => {
          const trimmed = path.replace(/\/+$/, "");
          return trimmed === "" ? "/" : trimmed.toLowerCase();
        })
      ),
    []
  );

  const normalizedPathname = React.useMemo(() => {
    const trimmed = location.pathname.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed.toLowerCase();
  }, [location.pathname]);

  // Detect role from token and adjust context
  useEffect(() => {
    const auth = getValidToken();
    if (!auth) {
      setCurrentView("customer");
      if (protectedPathSet.has(normalizedPathname)) {
        navigate("/login", { replace: true });
      }
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
  }, [navigate, normalizedPathname, protectedPathSet, setCurrentView]);

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