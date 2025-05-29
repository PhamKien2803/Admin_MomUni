import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
