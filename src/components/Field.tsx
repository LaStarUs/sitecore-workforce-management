import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  as?: 'input' | 'select';
  children?: ReactNode;
}

/** Labelled input or select with an accessible error message. */
export function Field({ label, value, onChange, error, type = 'text', as = 'input', children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  };
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {as === 'select' ? (
        <select {...shared} onChange={(e) => onChange(e.target.value)}>
          {children}
        </select>
      ) : (
        <input {...shared} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
