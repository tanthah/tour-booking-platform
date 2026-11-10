/**
 * Helper Validation cho Trang Checkout & Thông tin Hành khách
 * Tuân thủ quy định:
 * - Kiểm tra họ tên, số điện thoại Việt Nam, ngày sinh, CCCD/CMND
 * - Bắt buộc duy nhất 1 khách dùng thông tin người đặt
 * - Ràng buộc tuổi theo loại khách (Người lớn >= 12t, Trẻ em 2-11t, Em bé < 2t)
 * - Ràng buộc không trùng CCCD/CMND giữa các khách
 */

// Regex kiểm tra số điện thoại Việt Nam (10 chữ số, đầu 03, 05, 07, 08, 09)
export const PHONE_REGEX = /^(0[35789])([0-9]{8})$/;

// Regex kiểm tra CCCD/CMND (9 hoặc 12 số)
export const ID_NUMBER_REGEX = /^[0-9]{9}$|^[0-9]{12}$/;

// Regex email
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Tính số tuổi dựa trên chuỗi ngày sinh YYYY-MM-DD
 */
export const calculateAge = (dobString) => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Validate thông tin người đặt tour (Customer Info)
 */
export const validateCustomerInfo = (info) => {
  const errors = {};

  if (!info.full_name || !info.full_name.trim()) {
    errors.full_name = 'Vui lòng nhập họ và tên người đặt.';
  } else if (info.full_name.trim().length < 2) {
    errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự.';
  } else if (/[0-9]/.test(info.full_name)) {
    errors.full_name = 'Họ và tên không được chứa chữ số.';
  }

  if (!info.phone || !info.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại người đặt.';
  } else if (!PHONE_REGEX.test(info.phone.trim())) {
    errors.phone = 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09).';
  }

  if (info.email && info.email.trim() && !EMAIL_REGEX.test(info.email.trim())) {
    errors.email = 'Địa chỉ email không đúng định dạng.';
  }

  if (info.date_of_birth) {
    const dob = new Date(info.date_of_birth);
    if (isNaN(dob.getTime()) || dob > new Date()) {
      errors.date_of_birth = 'Ngày sinh không được ở tương lai.';
    }
  }

  if (info.id_number && info.id_number.trim()) {
    if (!ID_NUMBER_REGEX.test(info.id_number.trim())) {
      errors.id_number = 'Số CCCD/CMND phải gồm 9 hoặc 12 chữ số.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate thông tin cho một hành khách cụ thể
 */
export const validateSinglePassenger = (passenger, allPassengers, currentIndex) => {
  const errors = {};
  const isAdult = passenger.passenger_type === 'ADULT' || !passenger.passenger_type;
  const isChild = passenger.passenger_type === 'CHILD';
  const isBaby = passenger.passenger_type === 'BABY';

  // 1. Họ và tên
  if (!passenger.full_name || !passenger.full_name.trim()) {
    errors.full_name = 'Vui lòng nhập họ và tên hành khách.';
  } else if (passenger.full_name.trim().length < 2) {
    errors.full_name = 'Họ và tên quá ngắn.';
  } else if (/[0-9]/.test(passenger.full_name)) {
    errors.full_name = 'Họ và tên không được chứa chữ số.';
  }

  // 2. Số điện thoại (Bắt buộc cho người lớn, tùy chọn cho trẻ em/em bé)
  if (isAdult) {
    if (!passenger.phone || !passenger.phone.trim()) {
      errors.phone = 'Người lớn bắt buộc phải có số điện thoại liên hệ.';
    } else if (!PHONE_REGEX.test(passenger.phone.trim())) {
      errors.phone = 'Số điện thoại không đúng chuẩn 10 số (VD: 0912345678).';
    }
  } else if (passenger.phone && passenger.phone.trim() && !PHONE_REGEX.test(passenger.phone.trim())) {
    errors.phone = 'Số điện thoại không đúng chuẩn 10 số.';
  }

  // 3. Giới tính
  if (!passenger.gender) {
    errors.gender = 'Vui lòng chọn giới tính.';
  }

  // 4. Ngày sinh & Kiểm tra tuổi
  if (!passenger.date_of_birth) {
    errors.date_of_birth = 'Vui lòng nhập ngày sinh để làm thủ tục/bảo hiểm.';
  } else {
    const dob = new Date(passenger.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.date_of_birth = 'Ngày sinh không hợp lệ.';
    } else if (dob > new Date()) {
      errors.date_of_birth = 'Ngày sinh không được ở tương lai.';
    } else {
      const age = calculateAge(passenger.date_of_birth);
      if (age !== null) {
        if (isAdult && age < 12) {
          errors.date_of_birth = `Vé người lớn yêu cầu từ 12 tuổi trở lên (hiện tại: ${age} tuổi).`;
        } else if (isChild && (age < 2 || age >= 12)) {
          errors.date_of_birth = `Vé trẻ em yêu cầu từ 2 đến dưới 12 tuổi (hiện tại: ${age} tuổi).`;
        } else if (isBaby && age >= 2) {
          errors.date_of_birth = `Vé em bé yêu cầu dưới 2 tuổi (hiện tại: ${age} tuổi).`;
        } else if (age > 120) {
          errors.date_of_birth = 'Năm sinh không hợp lệ (tuổi quá cao).';
        }
      }
    }
  }

  // 5. CCCD / CMND
  const idNum = passenger.id_number ? passenger.id_number.trim() : '';
  if (isAdult) {
    if (!idNum) {
      errors.id_number = 'Người lớn bắt buộc nhập số CCCD/CMND (9 hoặc 12 số).';
    } else if (!ID_NUMBER_REGEX.test(idNum)) {
      errors.id_number = 'Số CCCD/CMND phải là dãy 9 hoặc 12 chữ số.';
    }
  } else if (idNum && !ID_NUMBER_REGEX.test(idNum)) {
    errors.id_number = 'Số định danh/CCCD phải là dãy 9 hoặc 12 chữ số.';
  }

  // 6. Kiểm tra trùng CCCD/CMND giữa các khách
  if (idNum) {
    const duplicate = allPassengers.some(
      (other, idx) => idx !== currentIndex && other.id_number && other.id_number.trim() === idNum
    );
    if (duplicate) {
      errors.id_number = 'Số CCCD/CMND này đã bị trùng với hành khách khác trong đơn.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate toàn bộ danh sách hành khách
 */
export const validateAllPassengers = (passengers) => {
  const allErrors = {};
  let isValid = true;
  let firstErrorIndex = null;

  passengers.forEach((p, idx) => {
    const result = validateSinglePassenger(p, passengers, idx);
    if (!result.isValid) {
      allErrors[idx] = result.errors;
      isValid = false;
      if (firstErrorIndex === null) firstErrorIndex = idx;
    }
  });

  return {
    isValid,
    passengerErrors: allErrors,
    firstErrorIndex,
  };
};
