import axiosAdmin from '../../config/axiosAdmin';

const articleService = {
  // ==================== BÀI VIẾT ====================
  getArticles: (params = {}) => axiosAdmin.get('/admin/articles', { params }),

  getArticleById: (id) => axiosAdmin.get(`/admin/articles/${id}`),

  createArticle: (data) => axiosAdmin.post('/admin/articles', data),

  updateArticle: (id, data) => axiosAdmin.put(`/admin/articles/${id}`, data),

  togglePublish: (id, publish) =>
    axiosAdmin.patch(`/admin/articles/${id}/publish`, { publish }),

  deleteArticle: (id) => axiosAdmin.delete(`/admin/articles/${id}`),

  // ==================== DANH MỤC ====================
  getCategories: (params = {}) =>
    axiosAdmin.get('/admin/article-categories', { params }),

  getActiveCategories: () =>
    axiosAdmin.get('/admin/article-categories/active'),

  createCategory: (data) =>
    axiosAdmin.post('/admin/article-categories', data),

  updateCategory: (id, data) =>
    axiosAdmin.put(`/admin/article-categories/${id}`, data),

  toggleCategoryStatus: (id, is_active) =>
    axiosAdmin.patch(`/admin/article-categories/${id}/status`, { is_active }),

  deleteCategory: (id) =>
    axiosAdmin.delete(`/admin/article-categories/${id}`),

  // ==================== UPLOAD ẢNH ====================
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosAdmin.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ==================== GỢI Ý TOUR ====================
  getToursForSelect: (search = '') =>
    axiosAdmin.get('/tours', { params: { search, limit: 20 } }),
};

export default articleService;
