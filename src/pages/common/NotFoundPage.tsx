import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page Not Found (404)</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
        The payroll, employee, or reporting endpoint you are seeking does not exist or has been relocated.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
