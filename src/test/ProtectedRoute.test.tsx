import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import * as AuthContextModule from '@/contexts/AuthContext';
import { User } from '@/types';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when session validation is pending', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      switchRole: vi.fn(),
      hasRole: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Validating PayPulse session...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchRole: vi.fn(),
      hasRole: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <Routes>
          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <div>Payroll Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Payroll Content')).not.toBeInTheDocument();
  });

  it('redirects unauthorized roles to /unauthorized', () => {
    const employeeUser: User = {
      id: 'usr-5',
      username: 'samir.eng',
      email: 'samir.eng@paypulse.internal',
      fullName: 'Samir Hasan',
      role: 'Employee',
      isActive: true,
      createdAt: '2023-03-01T00:00:00Z',
    };

    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: employeeUser,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchRole: vi.fn(),
      hasRole: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <Routes>
          <Route
            path="/payroll"
            element={
              <ProtectedRoute allowedRoles={['System Administrator', 'Payroll Officer']}>
                <div>Admin Payroll Management</div>
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<div>Access Denied Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Payroll Management')).not.toBeInTheDocument();
  });

  it('renders child component when user has required role', () => {
    const payrollUser: User = {
      id: 'usr-3',
      username: 'sadia.payroll',
      email: 'sadia.payroll@paypulse.internal',
      fullName: 'Sadia Sultana',
      role: 'Payroll Officer',
      isActive: true,
      createdAt: '2023-01-15T00:00:00Z',
    };

    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: payrollUser,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchRole: vi.fn(),
      hasRole: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <Routes>
          <Route
            path="/payroll"
            element={
              <ProtectedRoute allowedRoles={['System Administrator', 'Payroll Officer']}>
                <div>Admin Payroll Management</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Payroll Management')).toBeInTheDocument();
  });
});
