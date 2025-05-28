import { Navigate, Outlet } from "react-router-dom";
import { getUserFromToken } from "../helper/authHelper";

const PrivateRoute = ({ allowedRoles }) => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    const userData = getUserFromToken(accessToken);
    const userRole = userData?.role;

    if (!userRole || (allowedRoles && !allowedRoles.includes(userRole))) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
