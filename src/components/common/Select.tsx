import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  hasError?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, hasError = false, placeholder, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`block w-full text-sm rounded-lg border bg-white text-slate-900 transition-colors disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 px-3 py-2 ${
          hasError
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
