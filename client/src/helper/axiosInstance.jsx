import axios from "axios";

const axiosInstance = axios.create({
    // baseURL: "http://localhost:9999/api",
    // baseURL: "http://localhost:7071/api/",
    baseURL: "https://azure-app-services-ggdrdnf8aeb3evhc.eastasia-01.azurewebsites.net/api/",
    withCredentials: true,
});

// axiosInstance.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem("accessToken");
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

export default axiosInstance;
