// 검증 관련

// 영문/숫자 필수, 특수문자 선택, 8~64자
export const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 010-1234-5678 형식 허용(하이픈 없어도 입력 가능)
export const rePassword = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()[\]{};:,.?/~_+\-=|]{8,64}$/;

// 숫자만 10~11자리
export const rePhoneLoose = /^0\d{9,10}$/; 


export const reBirthdayDot = /^\d{4}\.\d{2}\.\d{2}$/;

export function formatPhone(val: string) {
  const d = (val || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
  return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}

export function isValidPhone(val: string) {
  const digits = (val || "").replace(/\D/g, "");
  if (!rePhoneLoose.test(digits)) return false;
  // 10자리: 02 지역번호 케이스 등 고려, 11자리: 모바일(010 등)
  return digits.length === 10 || digits.length === 11;
}

export function toBirthdayDotFromInputDate(inputDate: string) {
  // input type="date" → yyyy-MM-dd 를 yyyy.MM.dd 로 변환
  if (!inputDate) return "";
  const [y, m, d] = inputDate.split("-");
  return `${y}.${m}.${d}`;
}

export function isValidBirthdayDot(birthdayDot: string, minAge = 14, maxAge = 120) {
  if (!reBirthdayDot.test(birthdayDot)) return false;
  const [y, m, d] = birthdayDot.split(".").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
  const today = new Date();
  if (dt > today) return false;

  const age = today.getFullYear() - y - (today < new Date(today.getFullYear(), m - 1, d) ? 1 : 0);
  if (age < minAge || age > maxAge) return false;
  return true;
}
