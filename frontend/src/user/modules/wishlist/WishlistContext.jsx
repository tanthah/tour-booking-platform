import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addWishlistTour, getWishlist, removeWishlistTour } from './wishlist.api';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children, user }) => {
  const [favoriteTours, setFavoriteTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const favoriteIds = useMemo(
    () => new Set(favoriteTours.map((tour) => String(tour._id))),
    [favoriteTours]
  );

  const refreshWishlist = useCallback(async () => {
    if (!user || !localStorage.getItem('token')) {
      setFavoriteTours([]);
      setError('');
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError('');
    try {
      const response = await getWishlist();
      const tours = response?.data?.tours || [];
      setFavoriteTours(tours);
      return tours;
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách yêu thích.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user || !localStorage.getItem('token')) {
      setFavoriteTours([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');
    getWishlist()
      .then((response) => {
        if (active) setFavoriteTours(response?.data?.tours || []);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Không thể tải danh sách yêu thích.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const toggleFavorite = useCallback(async (tour) => {
    const tourId = typeof tour === 'string' ? tour : (tour?._id || tour?.id);
    if (!tourId) throw new Error('Không tìm thấy tour để cập nhật yêu thích.');
    if (!user || !localStorage.getItem('token')) throw new Error('Vui lòng đăng nhập để lưu tour yêu thích.');

    const id = String(tourId);
    const wasFavorite = favoriteIds.has(id);
    setError('');

    if (wasFavorite) {
      await removeWishlistTour(id);
      setFavoriteTours((current) => current.filter((item) => String(item._id) !== id));
    } else {
      await addWishlistTour(id);
      if (typeof tour === 'object') {
        const savedTour = { ...tour, _id: id };
        setFavoriteTours((current) => (
          current.some((item) => String(item._id) === id) ? current : [savedTour, ...current]
        ));
      } else {
        await refreshWishlist();
      }
    }
    return !wasFavorite;
  }, [favoriteIds, refreshWishlist, user]);

  const value = {
    favoriteTours,
    favoriteIds,
    loading,
    error,
    isAuthenticated: Boolean(user && localStorage.getItem('token')),
    isFavorite: (tourId) => favoriteIds.has(String(tourId)),
    toggleFavorite,
    refreshWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist phải được dùng bên trong WishlistProvider');
  return context;
};
