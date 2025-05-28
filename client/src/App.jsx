// src/App.jsx
import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdminPage from "./page/Auth/LoginComponents";
import ForgotPassword from "./page/Auth/ForgotPassword";
import VerifyOTP from './page/Auth/VerifyOTP';
import ResetPassword from "./page/Auth/ResetPassword";
import AdminLayout from "./page/Admin/AdminLayout";
import PublicRoute from './routes/PublicRoute';
import { mainRoute } from "./routes/mainRoute";
import { routesAdmin } from "./routes/routes";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LoginAdminPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Private Routes */}
        {Object.entries(mainRoute).map(([role, routeList]) => (
          <Route key={role} element={<PrivateRoute allowedRoles={[role]} />}>
            {role === "admin" ? (
              <Route element={<AdminLayout />}>
                {routesAdmin.map(({ path, component: Component }) => (
                  <Route key={path} path={path} element={<Component />} />
                ))}
              </Route>
            ) : (
              routeList.map(({ path, component: Component }) => (
                <Route key={path} path={path} element={Component} />
              ))
            )}
          </Route>
        ))}

      </Routes>
    </BrowserRouter>
  );
}

export default App;
