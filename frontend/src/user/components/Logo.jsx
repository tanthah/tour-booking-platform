/**
 * Logo Component - Đại diện thương hiệu Tourn Go
 * Được vẽ bằng SVG vector chuẩn nét cao, tông màu Cam Hoàng Hôn năng động
 */
const Logo = ({ height = 36, logoUrl = '' }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" style={{ height: height, objectFit: 'contain' }} />
      ) : (
      <svg
        width={height * 1.25}
        height={height}
        viewBox="0 0 70 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Nửa quả địa cầu / Mặt trời màu cam đỏ ở trên */}
        <path
          d="M 12 28 C 12 14, 23 4, 38 4 C 47 4, 55 9, 60 16 C 48 18, 30 20, 16 26 Z"
          fill="#ff4d15"
        />
        
        {/* Vệt lượn sóng màu xanh ngọc / lam nhạt */}
        <path
          d="M 8 32 C 16 42, 38 44, 58 20 C 44 26, 22 28, 8 32 Z"
          fill="#5ac8fa"
        />

        {/* Cung đáy màu cam đậm */}
        <path
          d="M 14 36 C 22 48, 44 48, 52 38 C 38 42, 22 40, 14 36 Z"
          fill="#ea580c"
        />

        {/* Biểu tượng máy bay nghiêng hướng lên phía trên bên phải */}
        <g transform="translate(48, 4) rotate(42) scale(0.9)">
          <path
            d="M14 2.5L17.5 9.5L25 11L19 15.5L21 23L14 19L7 23L9 15.5L3 11L10.5 9.5L14 2.5Z"
            fill="#ea580c"
          />
        </g>
      </svg>
      )}
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 900,
          fontSize: `${Math.round(height * 0.58)}px`,
          letterSpacing: '1px',
          lineHeight: 1,
        }}
      >
        <span style={{ color: '#0A2E65' }}>Tourn</span>{' '}
        <span style={{ color: '#0086FF' }}>Go</span>
      </span>
    </div>
  );
};

export default Logo;
