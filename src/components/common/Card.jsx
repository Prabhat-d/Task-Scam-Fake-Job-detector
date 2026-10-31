/**
 * Bordered white card (slatenavy in dark mode). Optional header with title, subtitle and actions.
 */
export default function Card({ title, subtitle, icon: Icon, actions, className = '', bodyClassName = 'p-5', hover = false, children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`card ${hover ? 'card-hover' : ''} ${className}`} {...rest}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b divider">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon size={18} className="text-primary shrink-0" aria-hidden />}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-heading truncate">{title}</h2>
              {subtitle && <p className="text-xs text-subtle truncate">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </Tag>
  );
}
