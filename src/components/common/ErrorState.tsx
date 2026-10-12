import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected network error occurred while communicating with the service.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-rose-50/50 rounded-lg border border-rose-200 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 mb-1">{title}</h3>
      <p className="text-sm text-rose-700 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 border border-rose-300 text-sm font-medium rounded-md text-rose-800 bg-white hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Request
        </button>
      )}
    </div>
  );
};
