import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Tự động cuộn trang lên đầu trang (top: 0, left: 0) mỗi khi chuyển trang (pathname thay đổi)
 * hoặc khi load lại trang, đảm bảo người dùng luôn nhìn thấy Header đầu trang thay vì bị cuộn xuống Footer.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Tắt scroll restoration của trình duyệt để ngăn trình duyệt tự nhớ vị trí cuộn cũ ở footer
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Cuộn ngay lập tức lên đỉnh trang
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    // Dự phòng thêm cho các trình duyệt hoặc trường hợp body scroll
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
