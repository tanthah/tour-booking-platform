/**
 * Helper class chuẩn hóa định dạng JSON Response trả về cho Frontend
 */

class ApiResponse {
  /**
   * Phương thức trả về Response thành công (Success Response)
   * @param {object} res - Express Response object
   * @param {number} statusCode - Mã trạng thái HTTP (Default: 200)
   * @param {string} message - Thông điệp phản hồi
   * @param {object} data - Payload dữ liệu gửi kèm
   */
  static success(res, statusCode = 200, message = 'Thành công', data = null) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Phương thức trả về Response thất bại / lỗi (Error Response)
   * @param {object} res - Express Response object
   * @param {number} statusCode - Mã trạng thái HTTP (Default: 500)
   * @param {string} message - Thông điệp báo lỗi
   * @param {array} errors - Danh sách chi tiết lỗi Validation (nếu có)
   */
  static error(res, statusCode = 500, message = 'Lỗi hệ thống', errors = []) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}

module.exports = ApiResponse;
