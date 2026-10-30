import { forwardRef, useId } from 'react';

/** Labelled input with inline error + helper text. Renders a textarea when `textarea` is set. */
const Field = forwardRef(function Field({ label, error, hint, textarea, className = '', inputClassName = '', mono = false, ...rest }, ref) {
  const id = useId();
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <Tag
        id={id}
        ref={ref}
        className={`input ${error ? 'input-error' : ''} ${mono ? 'font-mono' : ''} ${inputClassName}`}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {error ? <p id={`${id}-err`} className="field-error">{error}</p> : hint ? <p id={`${id}-hint`} className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
});

export default Field;
