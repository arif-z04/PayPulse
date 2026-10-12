import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import * as AuthContextModule from '@/contexts/AuthContext';
import * as ToastContextModule from '@/contexts/ToastContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      switchRole: vi.fn(),
      hasRole: vi.fn(),
    });
    vi.mocked(ToastContextModule.useToast).mockReturnValue({
      toasts: [],
      success: mockSuccess,
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      removeToast: vi.fn(),
    });
  });

  it('renders login form and enterprise branding', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('PayPulse')).toBeInTheDocument();
    expect(screen.getByText('Sign in to Enterprise Workspace')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@paypulse.internal/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted with empty fields', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/name@paypulse.internal/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/);

    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Username or email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('populates credentials when quick role buttons are clicked', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Look for quick role buttons like HR or Payroll
    const hrButton = screen.getByText('Farzana Yeasmin');
    fireEvent.click(hrButton);

    const emailInput = screen.getByPlaceholderText(/name@paypulse.internal/i) as HTMLInputElement;
    expect(emailInput.value).toBe('farzana.hr@paypulse.internal');
  });

  it('submits form with valid credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/name@paypulse.internal/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/);

    fireEvent.change(emailInput, { target: { value: 'admin@paypulse.internal' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockLogin).toHaveBeenCalledWith({
      emailOrUsername: 'admin@paypulse.internal',
      password: 'password123',
      rememberMe: true,
    });
  });
});
