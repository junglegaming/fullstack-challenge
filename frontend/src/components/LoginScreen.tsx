interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  return (
    <div className="login-screen">
      <div className="card login-card">
        <div className="logo-big">🚀</div>
        <h1>Crash Game</h1>
        <p>
          Aposte, veja o multiplicador subir e saque antes do crash. Entre com
          sua conta para jogar.
        </p>
        <button className="btn bet" onClick={onLogin}>
          Entrar com Keycloak
        </button>
        <div className="creds">
          Usuário de teste: <code>player</code> / <code>player123</code>
        </div>
      </div>
    </div>
  );
}
