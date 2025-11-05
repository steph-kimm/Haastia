import React, { useEffect } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
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

  const protectedPaths = React.useMemo(
    () => professionalRouteConfig.map(({ path }) => path),
    []
  );

  const isProtectedPath = React.useCallback(
    (pathname) =>
      protectedPaths.some((protectedPath) =>
        matchPath({ path: protectedPath, end: true }, pathname)
      ),
    [protectedPaths]
  );

  // Detect role from token and adjust context
  useEffect(() => {
    const auth = getValidToken();
    if (!auth) {
      setCurrentView("customer");
      if (isProtectedPath(location.pathname)) {
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
  }, [isProtectedPath, location.pathname, navigate, setCurrentView]);

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