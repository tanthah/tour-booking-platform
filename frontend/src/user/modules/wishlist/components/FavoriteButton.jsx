import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../WishlistContext';
import '../wishlist.css';

const FavoriteButton = ({ tour, className = '' }) => {
  const { isAuthenticated, isFavorite, loading, toggleFavorite } = useWishlist();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const tourId = tour?._id || tour?.id;
  const favorite = isFavorite(tourId);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMessage('');

    if (!isAuthenticated) {
      window.dispatchEvent(new Event('tourgo:open-login'));
      return;
    }

    setPending(true);
    try {
      await toggleFavorite(tour);
    } catch (error) {
      setMessage(error?.message || 'Không thể cập nhật yêu thích.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={`wishlist-toggle-wrap ${className}`}>
      <button
        type="button"
        className={`wishlist-toggle-button ${favorite ? 'is-favorite' : ''}`}
        aria-label={favorite ? 'Bỏ tour khỏi danh sách yêu thích' : 'Thêm tour vào danh sách yêu thích'}
        aria-pressed={favorite}
        title={favorite ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
        disabled={loading || pending || !tourId}
        onClick={handleClick}
      >
        <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
      </button>
      {message && <span className="wishlist-toggle-error" role="status">{message}</span>}
    </div>
  );
};

export default FavoriteButton;
