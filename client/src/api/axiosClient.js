import axios from 'axios';

const apiURL ='https://milk-dairy-4bi2.onrender.com/api';

const axiosClient = axios.create({
  baseURL: apiURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to format results and handle auth expiration errors
axiosClient.interceptors.response.use(
  (response) => {
    // Unify responses. If backend returns standard { success, data, error }, we return response.data
    return response.data;
  },
  (error) => {
    // Check if unauthorized, possibly clearing session
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      // Let AuthContext handle redirects if listening to localstorage or state changes
    }
    
    // Normalize error shape to match standard { success: false, data: null, error: message }
    const unifiedError = {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Request failed',
    };
    
    return Promise.reject(unifiedError);
  }
);

export default axiosClient;
