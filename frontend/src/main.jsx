import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Intercept axios requests to rewrite localhost URLs to the production hosted backend API URL if set in environment variables
axios.interceptors.request.use((config) => {
  const apiURL = import.meta.env.VITE_API_URL;
  if (apiURL && config.url && config.url.startsWith('http://localhost:5000')) {
    config.url = config.url.replace('http://localhost:5000', apiURL);
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
