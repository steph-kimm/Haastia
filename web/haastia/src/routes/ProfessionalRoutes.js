import React from "react";
import { Route, Routes } from "react-router-dom";

import ProfessionalRouteGuard from "./ProfessionalRouteGuard";
import {
  customerRouteConfig,
  professionalRouteConfig,
} from "./routeConfig";

const ProfessionalRoutes = () => {
  return (
    <Routes>
      {customerRouteConfig.map(({ path, component: Component }) => (
        <Route
          key={`customer-${path}`}
          path={path}
          element={<Component />}
        />
      ))}

      {professionalRouteConfig.map(({ path, component: Component }) => (
        <Route
          key={`professional-${path}`}
          path={path}
          element={
            <ProfessionalRouteGuard>
              <Component />
            </ProfessionalRouteGuard>
          }
        />
      ))}
    </Routes>
  );
};

export default ProfessionalRoutes;
