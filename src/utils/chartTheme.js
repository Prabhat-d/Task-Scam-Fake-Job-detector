import { useThemeStore } from '../store/themeStore.js';

/** Recharts colours that follow the light/dark theme. */
export function useChartTheme() {
  const dark = useThemeStore((s) => s.theme === 'dark');
  return {
    grid: dark ? '#334155' : '#e2e8f0',
    axis: dark ? '#94a3b8' : '#64748b',
    tooltip: {
      contentStyle: { background: '#0f172a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 },
      itemStyle: { color: '#fff' },
      labelStyle: { color: '#cbd5e1' },
      cursor: { fill: dark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' },
    },
  };
}
