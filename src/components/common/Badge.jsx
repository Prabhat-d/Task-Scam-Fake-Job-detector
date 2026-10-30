const TONES = {
  neutral: 'bg-page text-ink border border-line dark:bg-navy dark:text-slate-300 dark:border-ink',
  primary: 'bg-primary/10 text-blue-700 dark:text-blue-300',
  teal: 'bg-teal/10 text-teal dark:text-[#2dd4bf]',
  danger: 'bg-dangerSoft text-red-700 dark:bg-danger/15 dark:text-red-300',
  warning: 'bg-warningSoft text-amber-700 dark:bg-warning/15 dark:text-amber-300',
  success: 'bg-successSoft text-emerald-700 dark:bg-success/15 dark:text-emerald-300',
  dark: 'bg-navy text-white dark:bg-black/40',
};

/** Small status chip. Tones: neutral | primary | teal | danger | warning | success | dark. */
export default function Badge({ tone = 'neutral', icon: Icon, className = '', children, ...rest }) {
  return (
    <span className={`chip ${TONES[tone]} ${className}`} {...rest}>
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}
