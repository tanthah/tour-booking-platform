import axios from 'axios';

/**
 * Axios Client cho Admin Panel
 * Tự động đính kèm JWT Token và xử lý response/error tập trung
 */
const axiosAdmin = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Tự động đính kèm JWT Token từ localStorage
axiosAdmin.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap data và xử lý lỗi HTTP tập trung
axiosAdmin.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const response = error.response;
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    const errorData = response?.data || {
      success: false,
      message: 'Không thể kết nối đến server. Vui lòng thử lại.',
    };
    return Promise.reject(errorData);
  }
);

export default axiosAdmin;

