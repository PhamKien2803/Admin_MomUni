import menuItems from "../page/Admin/menuItems";

export const routesAdmin = menuItems.map(({ path, component }) => ({
    path,
    component,
}));
