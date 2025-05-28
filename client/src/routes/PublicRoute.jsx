import { Navigate, Outlet } from "react-router-dom";
import { getUserFromToken } from "../helper/authHelper";

const PublicRoute = () => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
        const userData = getUserFromToken(accessToken);
        if (userData) {
            const { role } = userData;
            if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
            return <Navigate to="/" replace />;
        }
    }
    return <Outlet />;
};

export default PublicRoute;
