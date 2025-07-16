import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdminPage from "./page/Auth/LoginComponents";
import ForgotPassword from "./page/Auth/ForgotPassword";
import VerifyOTP from './page/Auth/VerifyOTP';
import ResetPassword from "./page/Auth/ResetPassword";
import AdminLayout from "./page/Admin/AdminLayout";
import PublicRoute from './routes/PublicRoute';
import PrivateRoute from "./routes/PrivateRoute";
import { routesAdmin } from "./routes/routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LoginAdminPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Admin private routes */}
        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/admin-dashboard" element={<AdminLayout />}>
            {routesAdmin.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path.replace("/admin-dashboard/", "")}
                element={<Component />}
              />
            ))}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
