const OrderItemsList = ({ items = [] }) => {
  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
        Danh Sách Tour Đặt ({items.length})
      </h3>
      {items.map((item) => (
        <div key={item._id} className="d-flex flex-wrap gap-3 pb-3 mb-3 border-bottom">
          {item.main_image && (
            <img
              src={item.main_image}
              alt={item.tour_name}
              style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
            />
          )}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{item.tour_name}</div>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Mã: <strong>{item.tour_code || 'N/A'}</strong> | {item.duration || 'N/A'}
            </div>
            {item.departure_date && (
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                Khởi hành: <strong>{new Date(item.departure_date).toLocaleDateString('vi-VN')}</strong> ({item.departure_location})
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginTop: '4px' }}>
              {item.quantity_adult} lớn ({item.price_adult?.toLocaleString('vi-VN')} đ)
              {item.quantity_child > 0 ? `, ${item.quantity_child} trẻ` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>
            {(item.subtotal || 0).toLocaleString('vi-VN')} đ
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderItemsList;

