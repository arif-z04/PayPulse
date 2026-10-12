import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '@/services/api/authService';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('authenticates valid credentials and saves session to localStorage', async () => {
    const session = await authService.login({
      emailOrUsername: 'admin@paypulse.internal',
      password: 'password123',
    });

    expect(session).toBeDefined();
    expect(session.user.email).toBe('admin@paypulse.internal');
    expect(session.user.role).toBe('System Administrator');
    expect(session.accessToken).toContain('mock-jwt-token');

    expect(localStorage.getItem('paypulse_token')).toBe(session.accessToken);
    const storedUser = JSON.parse(localStorage.getItem('paypulse_user') || '{}');
    expect(storedUser.id).toBe(session.user.id);
  });

  it('authenticates using username case-insensitively', async () => {
    const session = await authService.login({
      emailOrUsername: 'FARZANA.HR',
      password: 'password123',
    });

    expect(session.user.role).toBe('HR Manager');
  });

  it('throws 400 error for non-existent user account', async () => {
    await expect(
      authService.login({
        emailOrUsername: 'unknown@example.com',
        password: 'password123',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('User account does not exist'),
    });
  });

  it('throws 400 error for short/invalid password', async () => {
    await expect(
      authService.login({
        emailOrUsername: 'admin@paypulse.internal',
        password: '12',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('at least 4 characters'),
    });
  });

  it('clears stored session on logout', async () => {
    await authService.login({
      emailOrUsername: 'admin@paypulse.internal',
      password: 'password123',
    });
    expect(localStorage.getItem('paypulse_token')).not.toBeNull();

    await authService.logout();
    expect(localStorage.getItem('paypulse_token')).toBeNull();
    expect(localStorage.getItem('paypulse_user')).toBeNull();
  });

  it('switches role demo preview cleanly', async () => {
    // switch to usr-3 (Payroll Officer)
    const switched = await authService.switchRole('usr-3');
    expect(switched.role).toBe('Payroll Officer');
    expect(localStorage.getItem('paypulse_user')).toContain('Payroll Officer');
  });

  it('sends forgot password confirmation', async () => {
    const res = await authService.forgotPassword('test@paypulse.internal');
    expect(res.success).toBe(true);
    expect(res.message).toContain('test@paypulse.internal');
  });
});
