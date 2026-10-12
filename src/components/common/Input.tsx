import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="relative rounded-lg">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`block w-full text-sm rounded-lg border bg-white text-slate-900 transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${rightIcon ? 'pr-9' : 'pr-3'} py-2 ${
            hasError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
