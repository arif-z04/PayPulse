import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { AuthSession, User } from '@/types';
import { mockDb, delay } from '@/mocks/mockDb';

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (config.enableMockApi) {
      await delay(300);
      const users = mockDb.getUsers();
      const input = credentials.emailOrUsername.toLowerCase().trim();

      const user = users.find(
        (u) =>
          u.email.toLowerCase() === input ||
          u.username.toLowerCase() === input
      );

      if (!user) {
        throw {
          statusCode: 400,
          message: 'Invalid credentials. User account does not exist.',
          errors: { emailOrUsername: ['Account not found'] },
        };
      }

      if (!user.isActive) {
        throw {
          statusCode: 403,
          message: 'Your account is disabled. Contact your System Administrator.',
        };
      }

      // Check dummy password: accept anything longer than 3 chars or 'password' / 'admin123'
      if (credentials.password.length < 4) {
        throw {
          statusCode: 400,
          message: 'Invalid password. Password must be at least 4 characters.',
          errors: { password: ['Incorrect password'] },
        };
      }

      const session: AuthSession = {
        user,
        accessToken: `mock-jwt-token-${user.id}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      };

      localStorage.setItem('paypulse_token', session.accessToken);
      localStorage.setItem('paypulse_user', JSON.stringify(session.user));

      mockDb.addAuditLog({
        tableName: 'User_Account',
        operation: 'UPDATE',
        recordId: user.id,
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        ipAddress: '127.0.0.1',
        oldValues: null,
        newValues: { lastLoginAt: new Date().toISOString() },
        description: `User ${user.fullName} logged in successfully`,
      });

      return session;
    }

    const res = await apiClient.post<AuthSession>('/auth/login', credentials);
    localStorage.setItem('paypulse_token', res.accessToken);
    localStorage.setItem('paypulse_user', JSON.stringify(res.user));
    return res;
  },

  async logout(): Promise<void> {
    if (config.enableMockApi) {
      await delay(100);
      localStorage.removeItem('paypulse_token');
      localStorage.removeItem('paypulse_user');
      return;
    }

    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('paypulse_token');
      localStorage.removeItem('paypulse_user');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem('paypulse_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async switchRole(userId: string): Promise<User> {
    await delay(150);
    const users = mockDb.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found');
    localStorage.setItem('paypulse_user', JSON.stringify(target));
    return target;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (config.enableMockApi) {
      await delay(400);
      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${email}. Check your corporate inbox.`,
      };
    }
    return apiClient.post('/auth/forgot-password', { email });
  },
};
