import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { keycloak } from "./keycloak";

interface AuthState {
  ready: boolean;
  authenticated: boolean;
  username: string;

  getToken: () => Promise<string | null>;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

let initStarted = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const usernameRef = useRef("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (initStarted) {
      return;
    }
    initStarted = true;

    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((auth) => {
        setAuthenticated(auth);
        if (auth) {
          const name =
            (keycloak.tokenParsed?.["preferred_username"] as string | undefined) ??
            "player";
          usernameRef.current = name;
          setUsername(name);
        }
        setReady(true);
      })
      .catch((err) => {
        console.error("Falha ao inicializar o Keycloak", err);
        setReady(true);
      });
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!keycloak.authenticated) {
      return null;
    }
    try {

      await keycloak.updateToken(30);
    } catch {

      keycloak.login();
      return null;
    }
    return keycloak.token ?? null;
  }, []);

  const login = useCallback(() => {
    keycloak.login();
  }, []);

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  const value: AuthState = {
    ready,
    authenticated,
    username,
    getToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }
  return ctx;
}
