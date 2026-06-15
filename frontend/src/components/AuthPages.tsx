import { useEffect, useState } from "react";
import { exchangeCodeForTokens, redirectToLogin } from "../services/auth";

export function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">Crash Game</span>
        <h1>Login to play</h1>
        <p>
          Use Keycloak to enter the game, see your wallet balance and place
          bets during the betting phase.
        </p>
        <button className="primary-button" onClick={() => void redirectToLogin()}>
          Login with Keycloak
        </button>
      </section>
    </main>
  );
}

export function AuthCallbackPage() {
  const [message, setMessage] = useState("Finishing login...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      setMessage("Authorization code was not returned by Keycloak.");
      return;
    }

    exchangeCodeForTokens(code)
      .then(() => {
        window.history.replaceState(null, "", "/");
        window.location.assign("/");
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Login failed");
      });
  }, []);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">Keycloak</span>
        <h1>{message}</h1>
      </section>
    </main>
  );
}
