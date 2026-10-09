import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Tự động đính kèm JWT Access Token vào HTTP Header Authorization (Bearer Token) nếu có trong LocalStorage
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

// Response Interceptor: Xử lý dữ liệu trả về và bắt lỗi HTTP tập trung cho Frontend
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const response = error.response;

    // Xử lý khi Token hết hạn hoặc không hợp lệ (HTTP Status 401 Unauthorized)
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Xóa Token trong LocalStorage nhưng giữ nguyên trang để tránh làm gián đoạn trải nghiệm người dùng
    }

    // Trả về Object Lỗi có cấu trúc thống nhất
    const errorData = response?.data || {
      success: false,
      message: 'Không thể kết nối đến server. Vui lòng thử lại.',
    };

    return Promise.reject(errorData);
  }
);

export default axiosClient;
