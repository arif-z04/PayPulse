import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/api/authService';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your corporate email address.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSuccessMessage(res.message);
    } catch {
      setError('Failed to initiate password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-100">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>

          <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Enter your verified PayPulse email address and we will dispatch a secure credential recovery link.
          </p>

          {successMessage ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">{successMessage}</p>
              <Link
                to="/login"
                className="inline-block mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Corporate Email" required error={error || undefined}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@paypulse.internal"
                  leftIcon={<Mail className="w-4 h-4" />}
                  hasError={!!error}
                  disabled={isLoading}
                />
              </FormField>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Sending instructions...' : 'Send Recovery Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
