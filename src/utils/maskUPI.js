/** Mask a UPI ID for public display: "earnfast92@ybl" → "ea******92@ybl". */
export function maskUPI(upi = '') {
  const [name, handle] = String(upi).split('@');
  if (!handle) return maskGeneric(upi);
  if (name.length <= 4) return `${name[0] || ''}***@${handle}`;
  return `${name.slice(0, 2)}${'*'.repeat(Math.min(6, name.length - 4))}${name.slice(-2)}@${handle}`;
}

/** Mask a phone number: "+91 98765 43210" → "+91 98•••••210". */
export function maskPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 6) return phone;
  const last = digits.slice(-3);
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91 ${local.slice(0, 2)}•••••${last}`;
}

export function maskGeneric(v = '') {
  const s = String(v);
  if (s.length <= 4) return s;
  return `${s.slice(0, 2)}${'*'.repeat(Math.min(6, s.length - 4))}${s.slice(-2)}`;
}

/** Mask any entity by its type. */
export function maskEntity(type, value) {
  if (type === 'upi') return maskUPI(value);
  if (type === 'phone') return maskPhone(value);
  return maskGeneric(value);
}
