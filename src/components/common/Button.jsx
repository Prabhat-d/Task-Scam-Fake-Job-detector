import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  teal: 'btn-teal',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

/**
 * Button with variants (primary | secondary | teal | danger | ghost), sizes and a loading state.
 * Pass `to` for an internal link or `href` for an external link.
 */
export default function Button({ variant = 'primary', size = 'md', loading = false, icon: Icon, iconRight: IconRight, to, href, className = '', children, disabled, ...rest }) {
  const cls = `btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const content = (
    <>
      {loading ? <Loader2 size={iconSize} className="animate-spin" aria-hidden /> : Icon && <Icon size={iconSize} aria-hidden />}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} aria-hidden />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>;
  return (
    <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
