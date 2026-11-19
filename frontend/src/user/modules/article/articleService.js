import axiosClient from '../../config/axiosClient';

const articleService = {
  getPublishedArticles: (params = {}) =>
    axiosClient.get('/articles', { params }),

  getFeaturedArticles: (limit = 5) =>
    axiosClient.get('/articles/featured', { params: { limit } }),

  getArticleBySlug: (slug) =>
    axiosClient.get(`/articles/${slug}`),

  getRelatedArticles: (slug, limit = 4) =>
    axiosClient.get(`/articles/${slug}/related`, { params: { limit } }),

  getActiveCategories: () =>
    axiosClient.get('/articles/categories'),
};

export default articleService;
