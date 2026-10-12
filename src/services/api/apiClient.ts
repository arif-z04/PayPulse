import { config } from '@/app/config/env';
import { ApiError } from '@/types';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('paypulse_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiError = {
        message: response.statusText || 'An unexpected server error occurred',
        statusCode: response.status,
      };

      try {
        const json = await response.json();
        if (json.message) errorData.message = json.message;
        if (json.errors) errorData.errors = json.errors;
      } catch {
        // Response body wasn't JSON
      }

      if (response.status === 401) {
        localStorage.removeItem('paypulse_token');
        localStorage.removeItem('paypulse_user');
        window.dispatchEvent(new CustomEvent('paypulse_auth_unauthorized'));
      }

      throw errorData;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
