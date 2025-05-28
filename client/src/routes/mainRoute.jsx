import { routesAdmin } from "./routes";

export const routesCustomer = [
    {
        name: "customer-dashboard",
        key: "customer-dashboard",
        path: "/customer-dashboard",
        // component: CustomerDashboard,
    }
];

export const mainRoute = {
    admin: routesAdmin,
};
