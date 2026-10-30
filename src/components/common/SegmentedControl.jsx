/** Tab-like segmented control. options: [{ value, label, icon }] */
export default function SegmentedControl({ value, onChange, options, label, className = '' }) {
  return (
    <div role="tablist" aria-label={label} className={`inline-flex flex-wrap gap-1 p-1 rounded-xl surface-2 border divider ${className}`}>
      {options.map(({ value: v, label: l, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium transition-colors ${
              active ? 'bg-white text-primary shadow-sm dark:bg-slatenavy' : 'text-muted hover:text-navy dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {l}
          </button>
        );
      })}
    </div>
  );
}
