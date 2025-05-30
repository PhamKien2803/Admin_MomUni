import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// axios.defaults.baseURL = "http://localhost:9999/api";
// axios.defaults.baseURL = "http://localhost:7071/api/";
axios.defaults.baseURL = "https://azure-app-services-ggdrdnf8aeb3evhc.eastasia-01.azurewebsites.net/api/";
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer />
  </StrictMode>,
)
