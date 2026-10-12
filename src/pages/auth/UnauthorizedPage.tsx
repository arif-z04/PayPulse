import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access Restricted (403)</h1>
      <p className="text-sm text-slate-600 max-w-md mt-2 mb-6">
        Your current role as <span className="font-semibold text-slate-900">&quot;{user?.role}&quot;</span> does not
        possess the authorization credentials necessary to view or manage this administrative resource.
      </p>
      <div className="flex gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
