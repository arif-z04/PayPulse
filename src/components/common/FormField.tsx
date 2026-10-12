import React from 'react';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
  htmlFor,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
};
