import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../utils/formatters.js';

/** Interpolate successSoft → warning → danger. */
function scale(t) {
  const stops = [
    [0, [236, 253, 245]],
    [0.5, [245, 158, 11]],
    [1, [239, 68, 68]],
  ];
  const i = t <= 0.5 ? 0 : 1;
  const [a, ca] = stops[i];
  const [b, cb] = stops[i + 1];
  const k = (t - a) / (b - a);
  const rgb = ca.map((v, j) => Math.round(v + (cb[j] - v) * k));
  return { fill: `rgb(${rgb.join(',')})`, text: t > 0.42 ? '#ffffff' : '#0f172a' };
}

/**
 * India heatmap as a tile-grid cartogram: every state is an equal tile placed roughly
 * where it sits on the map, so small states stay readable on mobile.
 * states: [{ code, name, x, y, count }]
 */
export default function ThreatMap({ states = [] }) {
  const { t, i18n } = useTranslation();
  const [hover, setHover] = useState(null);
  const max = useMemo(() => Math.max(1, ...states.map((s) => s.count)), [states]);
  const SIZE = 52;
  const GAP = 6;
  const cols = 9;
  const rows = 8;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${cols * (SIZE + GAP)} ${rows * (SIZE + GAP)}`} className="w-full h-auto max-h-[440px]" role="img" aria-label={t('threat.mapAria')}>
        {states.map((s) => {
          const c = scale(s.count / max);
          const x = s.x * (SIZE + GAP);
          const y = s.y * (SIZE + GAP);
          const active = hover?.code === s.code;
          return (
            <g
              key={s.code}
              tabIndex={0}
              role="button"
              aria-label={`${s.name}: ${formatNumber(s.count, i18n.language)}`}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s)}
              onBlur={() => setHover(null)}
              className="cursor-pointer outline-none"
            >
              <rect x={x} y={y} width={SIZE} height={SIZE} rx={8} fill={c.fill} stroke={active ? '#3b82f6' : 'rgba(15,23,42,0.08)'} strokeWidth={active ? 3 : 1} />
              <text x={x + SIZE / 2} y={y + 22} textAnchor="middle" fontSize="13" fontWeight="700" fill={c.text} fontFamily="Inter">{s.code}</text>
              <text x={x + SIZE / 2} y={y + 38} textAnchor="middle" fontSize="10" fill={c.text} opacity=".85" fontFamily="JetBrains Mono">{s.count}</text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="absolute top-2 left-2 rounded-lg bg-navy text-white px-3 py-2 text-xs shadow-lg pointer-events-none" role="status">
          <p className="font-semibold">{hover.name}</p>
          <p className="opacity-80">{t('threat.reportsCount', { count: hover.count })}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-xs text-subtle">
        <span>{t('threat.low')}</span>
        <span className="h-2 flex-1 max-w-[180px] rounded-full" style={{ background: 'linear-gradient(90deg,#ecfdf5,#f59e0b,#ef4444)' }} aria-hidden />
        <span>{t('threat.high')}</span>
      </div>
    </div>
  );
}
