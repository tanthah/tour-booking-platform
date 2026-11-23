import axiosClient from '../../config/axiosClient';

export const getWishlist = () => axiosClient.get('/wishlist');
export const addWishlistTour = (tourId) => axiosClient.put(`/wishlist/${tourId}`);
export const removeWishlistTour = (tourId) => axiosClient.delete(`/wishlist/${tourId}`);
