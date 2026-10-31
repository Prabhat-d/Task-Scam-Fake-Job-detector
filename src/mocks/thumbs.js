/** Generates small SVG "screenshot" thumbnails for seeded mock scans (no image assets needed). */

const svgUrl = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function chatThumb(accent = '#ef4444') {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200">
  <rect width="160" height="200" fill="#e7eef7"/>
  <rect width="160" height="26" fill="#229ED9"/><circle cx="16" cy="13" r="7" fill="#fff" opacity=".85"/>
  <rect x="30" y="9" width="60" height="8" rx="4" fill="#fff" opacity=".85"/>
  <rect x="10" y="38" width="100" height="22" rx="8" fill="#fff"/>
  <rect x="50" y="68" width="100" height="18" rx="8" fill="#d9fdd3"/>
  <rect x="10" y="94" width="120" height="30" rx="8" fill="#fff"/>
  <rect x="16" y="102" width="70" height="5" rx="2" fill="${accent}"/>
  <rect x="10" y="132" width="90" height="22" rx="8" fill="#fff"/>
  <rect x="60" y="162" width="90" height="18" rx="8" fill="#d9fdd3"/>
</svg>`);
}

export function letterThumb(accent = '#f59e0b') {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200">
  <rect width="160" height="200" fill="#fff"/><rect x=".5" y=".5" width="159" height="199" fill="none" stroke="#e2e8f0"/>
  <rect x="14" y="16" width="40" height="12" rx="2" fill="${accent}" opacity=".85"/>
  <rect x="14" y="40" width="110" height="6" rx="3" fill="#0f172a" opacity=".75"/>
  ${[58, 70, 82, 94, 106, 118, 130, 142].map((y, i) => `<rect x="14" y="${y}" width="${i % 3 === 2 ? 90 : 130}" height="4" rx="2" fill="#94a3b8"/>`).join('')}
  <rect x="14" y="160" width="50" height="4" rx="2" fill="#94a3b8"/><rect x="14" y="172" width="36" height="10" rx="2" fill="#0f172a" opacity=".2"/>
</svg>`);
}

export function postThumb(accent = '#3b82f6') {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200">
  <rect width="160" height="200" fill="#f8fafc"/>
  <rect x="10" y="12" width="140" height="176" rx="10" fill="#fff" stroke="#e2e8f0"/>
  <circle cx="30" cy="34" r="10" fill="${accent}" opacity=".8"/><rect x="46" y="28" width="70" height="6" rx="3" fill="#0f172a" opacity=".7"/>
  <rect x="46" y="38" width="40" height="4" rx="2" fill="#94a3b8"/>
  <rect x="20" y="58" width="120" height="50" rx="6" fill="${accent}" opacity=".12"/>
  ${[118, 128, 138, 148].map((y) => `<rect x="20" y="${y}" width="120" height="4" rx="2" fill="#94a3b8"/>`).join('')}
  <rect x="20" y="162" width="50" height="14" rx="7" fill="${accent}"/>
</svg>`);
}

/** Downscale an uploaded image File to a small data URL so mock history survives reloads. */
export function fileToThumb(file, max = 320) {
  return new Promise((resolve) => {
    if (!file.type?.startsWith('image/')) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
