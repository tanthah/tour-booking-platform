import { Col, Row, Spinner } from 'react-bootstrap';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import TourCard from '../../tours/components/TourCard';
import { useWishlist } from '../WishlistContext';
import '../wishlist.css';

const UserWishlistList = () => {
  const { favoriteTours, loading, error } = useWishlist();

  if (loading) {
    return <div className="wishlist-state"><Spinner animation="border" size="sm" /> Đang tải tour yêu thích...</div>;
  }

  if (error) return <div className="wishlist-error" role="alert">{error}</div>;

  if (!favoriteTours.length) {
    return (
      <div className="wishlist-empty-state">
        <Heart size={36} />
        <strong>Bạn chưa lưu tour yêu thích nào</strong>
        <span>Bấm biểu tượng trái tim trên tour để lưu lại và xem sau.</span>
        <Link to="/tours">Khám phá các tour</Link>
      </div>
    );
  }

  return (
    <div className="user-wishlist-list">
      <div className="user-wishlist-heading">
        <div>
          <h4>Danh sách yêu thích</h4>
          <p>{favoriteTours.length} tour đã lưu</p>
        </div>
      </div>
      <Row className="g-3">
        {favoriteTours.map((tour) => (
          <Col key={tour._id} sm={6} xl={4}>
            <TourCard tour={tour} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default UserWishlistList;
