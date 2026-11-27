/**
 * Helper tính giá bán theo loại hành khách (Người lớn / Trẻ em / Em bé).
 * Quy tắc:
 * - Giá người lớn: ưu tiên sale_price (kể cả 0đ), fallback original_price ?? 0
 * - Giá trẻ em: dùng price_child nếu admin đã nhập (kể cả 0đ), ngược lại 60% giá người lớn
 * - Giá em bé: dùng price_baby nếu admin đã nhập (kể cả 0đ), ngược lại 20% giá người lớn
 */
const DEFAULT_CHILD_PRICE_RATIO = 0.6;
const DEFAULT_BABY_PRICE_RATIO = 0.2;

const resolveTourPrices = (tour) => {
  const priceAdult = (tour?.sale_price !== null && tour?.sale_price !== undefined)
    ? tour.sale_price
    : (tour?.original_price ?? 0);

  const priceChild = (tour?.price_child !== null && tour?.price_child !== undefined)
    ? tour.price_child
    : Math.round(priceAdult * DEFAULT_CHILD_PRICE_RATIO);

  const priceBaby = (tour?.price_baby !== null && tour?.price_baby !== undefined)
    ? tour.price_baby
    : Math.round(priceAdult * DEFAULT_BABY_PRICE_RATIO);

  return { priceAdult, priceChild, priceBaby };
};

module.exports = {
  DEFAULT_CHILD_PRICE_RATIO,
  DEFAULT_BABY_PRICE_RATIO,
  resolveTourPrices,
};
