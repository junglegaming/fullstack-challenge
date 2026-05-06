"use client";

import { useCallback, useEffect, useState } from "react";
import KeycloakService, { TokenSet } from "@/services/keycloak";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string;
  token: string | null;
}

// Simple store to notify subscribers on token changes
let authState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  username: "Player",
  token: null,
};

const listeners = new Set<() => void>();

function updateAuthState(partial: Partial<AuthState>) {
  authState = { ...authState, ...partial };
  listeners.forEach((l) => l());
}

async function initAuth() {
  const token = KeycloakService.getToken();
  if (token && KeycloakService.isAuthenticated()) {
    updateAuthState({
      isAuthenticated: true,
      isLoading: false,
      username: KeycloakService.getUsername(),
      token,
    });
  } else if (token) {
    // Try refresh
    const tokens = await KeycloakService.refreshAccessToken();
    if (tokens) {
      updateAuthState({
        isAuthenticated: true,
        isLoading: false,
        username: KeycloakService.getUsername(),
        token: tokens.accessToken,
      });
    } else {
      updateAuthState({ isAuthenticated: false, isLoading: false, token: null });
    }
  } else {
    updateAuthState({ isAuthenticated: false, isLoading: false });
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    const listener = () => setState({ ...authState });
    listeners.add(listener);
    // Initialize on first mount
    if (authState.isLoading) {
      initAuth();
    }
    return () => { listeners.delete(listener); };
  }, []);

  // Auto-refresh token when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      KeycloakService.startAutoRefresh();
    } else {
      KeycloakService.stopAutoRefresh();
    }
  }, [state.isAuthenticated]);

  const login = useCallback(() => KeycloakService.login(), []);

  const logout = useCallback(() => {
    KeycloakService.stopAutoRefresh();
    KeycloakService.logout();
  }, []);

  const refresh = useCallback(async () => {
    const tokens = await KeycloakService.refreshAccessToken();
    if (tokens) {
      updateAuthState({
        isAuthenticated: true,
        username: KeycloakService.getUsername(),
        token: tokens.accessToken,
      });
    }
    return !!tokens;
  }, []);

  const getToken = useCallback(() => KeycloakService.getToken(), []);

  return {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    username: state.username,
    token: state.token,
    login,
    logout,
    refresh,
    getToken,
  };
}
