# Frontend — Crash Game

SPA em **Vite + React + TypeScript** do Crash Game. Consome a API REST pelo Kong
(`:8000`), escuta os eventos do jogo por WebSocket (socket.io) e autentica no
Keycloak via OIDC (Authorization Code + PKCE). Sem biblioteca de estado nem de
gráfico: estado ao vivo num `useReducer` e a curva do crash num `<canvas>`.

## Funcionalidades

- Login via Keycloak (OIDC + PKCE)
- Rodada atual com gráfico animado do multiplicador
- Apostar e sacar (cash out) em tempo real, com pagamento potencial
- Lista de apostas ao vivo e histórico de rodadas
- Verificação provably fair no próprio navegador
- Toasts de feedback (erro / sucesso)

## Fluxo de dados

```
Keycloak ──token──▶  client REST ──▶ Kong ──▶ Game / Wallet
WebSocket (socket.io) ──round.* / bet.*──▶ reducer ──▶ UI
Apostar / sacar ──REST──▶ resultado volta pelos eventos do WebSocket
```

O servidor é a fonte da verdade do multiplicador: o cliente faz o *seed* inicial
por REST (`/games/rounds/current` + histórico) e daí aplica os eventos ao vivo.

## Dependências do sistema

- **Node ≥ 20 + npm** para rodar/desenvolver isolado, ou **Bun + Docker** para o
  stack completo.
- **Backend no ar** (Kong em `:8000`) para a API REST e o WebSocket.
- **Keycloak** (`:8080`) para o login.
- Runtime: `react`, `react-dom`, `socket.io-client`, `keycloak-js`.

## Rodar

Junto com todo o stack (recomendado):

```bash
bun run docker:up
```

Em modo de desenvolvimento, com hot reload (precisa do backend no ar):

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev          # Vite em http://localhost:5173
npm run build        # build de produção
npm run preview      # serve o build em http://localhost:3000
npm run typecheck    # checagem de tipos
bun test             # testes (runner nativo do Bun + Testing Library)
```

## Variáveis

Em `.env` (use o `.env.example` como base); os padrões apontam para o stack local.
No container são passadas como build args (o Vite as embute no build, não em runtime).

| Variável                  | Padrão                  | Para quê              |
| ------------------------- | ----------------------- | --------------------- |
| `VITE_API_URL`            | `http://localhost:8000` | API REST (via Kong)   |
| `VITE_WS_URL`             | `http://localhost:8000` | WebSocket (socket.io) |
| `VITE_KEYCLOAK_URL`       | `http://localhost:8080` | Servidor Keycloak     |
| `VITE_KEYCLOAK_REALM`     | `crash-game`            | Realm                 |
| `VITE_KEYCLOAK_CLIENT_ID` | `crash-game-client`     | Client público (PKCE) |

**Usuário de teste:** `player` / `player123`. A doc completa está em `../README.md`.
