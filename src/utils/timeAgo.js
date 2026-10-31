/**
 * Human "time ago" using i18n keys: time.justNow, time.minutes, time.hours, time.days.
 * Pass the `t` function from useTranslation().
 */
export function timeAgo(date, t) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('time.justNow');
  if (m < 60) return t('time.minutes', { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('time.hours', { count: h });
  return t('time.days', { count: Math.floor(h / 24) });
}
