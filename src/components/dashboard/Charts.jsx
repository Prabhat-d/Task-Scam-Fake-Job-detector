import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useChartTheme } from '../../utils/chartTheme.js';
import { CHART_COLORS, VERDICT_COLORS } from '../../utils/constants.js';
import { formatDate } from '../../utils/formatters.js';

const legendStyle = { fontSize: 12 };

/** Stacked bars: scans per day by verdict. data: [{ day, scam, suspicious, genuine }] */
export function VerdictStackChart({ data, height = 220 }) {
  const { t, i18n } = useTranslation();
  const c = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} tickFormatter={(d) => formatDate(d, i18n.language, { day: 'numeric', month: 'short' })} minTickGap={16} />
        <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip {...c.tooltip} labelFormatter={(d) => formatDate(d, i18n.language)} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
        {['scam', 'suspicious', 'genuine'].map((k) => (
          <Bar key={k} dataKey={k} name={t(`verdict.${k}`)} stackId="v" fill={VERDICT_COLORS[k]} radius={k === 'genuine' ? [3, 3, 0, 0] : 0} maxBarSize={18} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Scams per hour (last 24h). data: [{ hour, scams }] */
export function HourlyLineChart({ data, height = 240 }) {
  const { t, i18n } = useTranslation();
  const c = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={CHART_COLORS[0]} stopOpacity={0.25} />
            <stop offset="1" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hour" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} tickFormatter={(h) => new Date(h).toLocaleTimeString(i18n.language === 'en' ? 'en-IN' : `${i18n.language}-IN`, { hour: '2-digit' })} minTickGap={20} />
        <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip {...c.tooltip} labelFormatter={(h) => new Date(h).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} />
        <Area type="monotone" dataKey="scams" name={t('threat.scamsDetected')} stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#hourFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Multi-line trend (admin). data: [{ day, scam, suspicious, genuine }] */
export function TrendLineChart({ data, height = 260 }) {
  const { t, i18n } = useTranslation();
  const c = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} tickFormatter={(d) => formatDate(d, i18n.language, { day: 'numeric', month: 'short' })} />
        <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip {...c.tooltip} labelFormatter={(d) => formatDate(d, i18n.language)} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
        {['scam', 'suspicious', 'genuine'].map((k) => (
          <Line key={k} type="monotone" dataKey={k} name={t(`verdict.${k}`)} stroke={VERDICT_COLORS[k]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bar chart. data: [{ label, count }] */
export function HBarChart({ data, height = 240, color = CHART_COLORS[0], name }) {
  const c = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={110} tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip {...c.tooltip} />
        <Bar dataKey="count" name={name} fill={color} radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut for verdict split. data: [{ verdict, count }] */
export function VerdictDonut({ data, height = 220 }) {
  const { t } = useTranslation();
  const c = useChartTheme();
  const rows = data.map((d) => ({ name: t(`verdict.${d.verdict}`), value: d.count, color: VERDICT_COLORS[d.verdict] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
          {rows.map((r) => <Cell key={r.name} fill={r.color} />)}
        </Pie>
        <Tooltip {...c.tooltip} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
