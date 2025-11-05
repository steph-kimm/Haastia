import React from "react";
import { Route, Routes } from "react-router-dom";

import ProfessionalRouteGuard from "./ProfessionalRouteGuard";
import {
  customerRouteConfig,
  professionalRouteConfig,
} from "./routeConfig";

const CustomerRoutes = () => {
  return (
    <Routes>
      {customerRouteConfig.map(({ path, component: Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}

      {professionalRouteConfig.map(({ path }) => (
        <Route
          key={`restricted-${path}`}
          path={path}
          element={<ProfessionalRouteGuard />}
        />
      ))}
    </Routes>
  );
};

export default CustomerRoutes;
