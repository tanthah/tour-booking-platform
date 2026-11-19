import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Camera, Sparkles } from 'lucide-react';
import MySouvenirCardsList from '../components/MySouvenirCardsList';

function MySouvenirsPage() {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '80vh', padding: '36px 0 72px' }}>
      <Container>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Camera size={26} color="#ea580c" />
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Kỷ Niệm Chuyến Đi
              </h1>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
              Trọn bộ thiệp tri ân, thông điệp cá nhân hóa và album ảnh chung của đoàn từ những chuyến đi bạn đã tham gia cùng TourGo.
            </p>
          </div>

          <Link
            to="/tours"
            className="btn btn-outline-warning"
            style={{ color: '#ea580c', borderColor: '#ea580c', fontWeight: 600, fontSize: '14px' }}
          >
            Khám phá thêm Tour
          </Link>
        </div>

        <MySouvenirCardsList />
      </Container>
    </div>
  );
}

export default MySouvenirsPage;

