const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizePhone = (phone) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (/^01\d{9}$/.test(digits)) digits = `2${digits}`;
  return digits;
};
module.exports = { normalizeEmail, normalizePhone };
