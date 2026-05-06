import { useEffect } from 'react';
import KeycloakService from '../services/keycloak';

function Login() {
  useEffect(() => {
    KeycloakService.login();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-4">Crash Game</h1>
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  );
}

export default Login;
