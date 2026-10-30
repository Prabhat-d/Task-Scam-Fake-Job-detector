/** Locale tag for Intl formatting per UI language. */
const LOCALE = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN' };
export const localeOf = (lang) => LOCALE[lang] || 'en-IN';

export const formatNumber = (n, lang = 'en') =>
  n == null ? '—' : new Intl.NumberFormat(localeOf(lang)).format(n);

export const formatINR = (n, lang = 'en') =>
  n == null || n === '' ? '—' : new Intl.NumberFormat(localeOf(lang), { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n));

export const formatDate = (d, lang = 'en', opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat(localeOf(lang), opts).format(new Date(d)) : '—';

export const formatDateTime = (d, lang = 'en') =>
  formatDate(d, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const formatBytes = (b) => {
  if (!b && b !== 0) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Backend-generated text may arrive as { en, hi, pa }. Pick the current language,
 * falling back to English, or return plain strings as-is.
 */
export const loc = (value, lang = 'en') => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || '';
};

/** Group items by created date into today / yesterday / week / older buckets. */
export const groupByDate = (items, key = 'createdAt') => {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const day = 86400000;
  const groups = { today: [], yesterday: [], week: [], older: [] };
  items.forEach((it) => {
    const t = startOfDay(new Date(it[key]));
    if (t >= today) groups.today.push(it);
    else if (t >= today - day) groups.yesterday.push(it);
    else if (t >= today - 7 * day) groups.week.push(it);
    else groups.older.push(it);
  });
  return groups;
};

/** Risk score → verdict tone used across the UI. */
export const scoreTone = (score) => (score >= 70 ? 'danger' : score >= 40 ? 'warning' : 'success');

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Build and download a CSV from an array of objects. */
export const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
};
