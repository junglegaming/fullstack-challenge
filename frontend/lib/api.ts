const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import KeycloakService from "@/services/keycloak";

export class ApiClient {
  private token: string | null = null;
  private refreshing: boolean = false;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const makeRequest = async (token: string | null): Promise<Response> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    };

    let res = await makeRequest(this.token);

    // If unauthorized, try refresh once
    if (res.status === 401 && !this.refreshing) {
      this.refreshing = true;
      try {
        const tokens = await KeycloakService.refreshAccessToken();
        if (tokens) {
          this.token = tokens.accessToken;
          // Retry with new token
          res = await makeRequest(this.token);
        }
      } finally {
        this.refreshing = false;
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

const api = new ApiClient();
export default api;
