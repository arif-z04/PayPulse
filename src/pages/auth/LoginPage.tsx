import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { INITIAL_USERS } from '@/mocks/mockData';
import { ApiError } from '@/types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [emailOrUsername, setEmailOrUsername] = useState('admin@paypulse.internal');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!emailOrUsername.trim()) {
      errors.emailOrUsername = 'Username or email is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ emailOrUsername, password, rememberMe });
      success('Logged in successfully. Welcome to PayPulse!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Authentication failed. Please check your credentials.');
      if (apiErr.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, msgs]) => {
          mapped[k] = msgs[0];
        });
        setFieldErrors(mapped);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setEmailOrUsername(email);
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background enterprise grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/20">
            PP
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">PayPulse</span>
        </div>
        <h2 className="mt-4 text-center text-xl font-semibold text-slate-200">
          Sign in to Enterprise Workspace
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Employee Payroll, Attendance & Leave Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-100">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Work Email / Username"
              required
              error={fieldErrors.emailOrUsername}
            >
              <Input
                type="text"
                value={emailOrUsername}
                onChange={(e) => {
                  setEmailOrUsername(e.target.value);
                  if (fieldErrors.emailOrUsername) setFieldErrors((prev) => ({ ...prev, emailOrUsername: '' }));
                }}
                placeholder="name@paypulse.internal or username"
                leftIcon={<Mail className="w-4 h-4" />}
                hasError={!!fieldErrors.emailOrUsername}
                disabled={isLoading}
                autoComplete="username"
              />
            </FormField>

            <FormField
              label="Password"
              required
              error={fieldErrors.password}
            >
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                hasError={!!fieldErrors.password}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </FormField>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember this session
              </label>

              <Link
                to="/forgot-password"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating with JWT...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Quick Login by Role:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {INITIAL_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  className="px-2 py-1.5 text-[11px] text-left border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <p className="font-semibold truncate">{u.role.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.fullName}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
