# Desafio Full-stack - Crash Game 🎮

## Bem-vindo à Jungle Gaming 🦧

A **Jungle Gaming** é uma software house especializada em iGaming — desenvolvemos plataformas de cassino online com tecnologia de ponta: NestJS, Bun, TanStack, DDD e arquitetura orientada a eventos. Somos apaixonados por engenharia de software e acreditamos que grandes produtos nascem de grandes times.

Este desafio é a porta de entrada para fazer parte desse time. Ele foi desenhado para refletir problemas reais do nosso dia a dia: sistemas distribuídos, tempo real, precisão monetária, experiência de usuário e arquitetura bem pensada.

Não esperamos perfeição — esperamos raciocínio claro, código limpo e decisões justificadas. Mostre como você pensa e como você constrói.

Boa sorte. Que o multiplicador esteja ao seu favor. 🎲

---

## Visão Geral 📖

Um **Crash Game** é um jogo de cassino multiplayer em tempo real: um multiplicador sobe a partir de `1.00x` e pode "crashar" a qualquer momento. Jogadores apostam antes da rodada e precisam sacar (cash out) antes do crash para garantir os ganhos — caso contrário, perdem a aposta.

Você deve construir o **backend** (engine do jogo, carteira, comunicação em tempo real) e o **frontend** (UI com animações, interface de apostas, histórico).

**Autenticação não faz parte do escopo.** Use um Identity Provider externo (Keycloak, Auth0 ou Okta).

---

## Índice 📋

- [Regras do Jogo](#regras-do-jogo)
- [Arquitetura](#arquitetura)
- [Tech Stack](#tech-stack-aceita)
- [Infraestrutura e Setup](#infraestrutura-e-setup)
- [Modelo de Domínio](#modelo-de-domínio)
- [Algoritmo Provably Fair](#algoritmo-provably-fair)
- [Referência da API](#referência-da-api)
- [Requisitos do Frontend](#requisitos-do-frontend)

- [Testes](#testes)
- [Critérios de Avaliação](#critérios-de-avaliação)
- [Entrega](#entrega)
- [Bônus](#bônus)

---

## Regras do Jogo 🎲

1. **Fase de Apostas** — Janela configurável (ex: 10s) para apostar. Cada jogador pode fazer apenas **uma aposta por rodada**.
2. **Início da Rodada** — O multiplicador começa em `1.00x` e sobe continuamente.
3. **Cash Out** — O jogador pode sacar a qualquer momento durante a rodada. Pagamento = `aposta × multiplicador atual`. Após sacar, não pode reentrar.
4. **Crash** — O multiplicador para em um ponto pré-determinado. Quem não sacou perde a aposta.
5. **Fim da Rodada** — Resultados revelados, saldos atualizados, nova fase de apostas começa.

**Restrições:**

- Aposta mínima: `1.00` / Máxima: `1.000,00`
- Saldo insuficiente → aposta rejeitada
- Sem aposta na rodada → não pode sacar
- Rodada ativa → não pode apostar (apenas na fase de apostas)

---

## Arquitetura 🏗️

```
                        ┌──────────────────────────┐
                        │        Frontend           │
                        │   (React + Tailwind CSS)  │
                        └─────┬────────────┬────────┘
                           HTTP/REST    WebSocket
                              │            │
                        ┌─────▼────────────▼────────┐
                        │         Kong               │
                        │      (API Gateway)         │
                        └─────┬────────────┬────────┘
                              │            │
                    ┌─────────▼──┐   ┌─────▼────────┐
                    │   Game     │   │   Wallet     │
                    │  Service   │   │   Service    │
                    │  (NestJS)  │   │   (NestJS)   │
                    └──┬─────┬──┘   └──────┬───────┘
                       │     └──────┬──────┘
                  ┌────▼────┐  ┌────▼──────────┐
                  │PostgreSQL│  │ RabbitMQ/SQS  │
                  └─────────┘  └───────────────┘

              ┌─────────────────┐
              │    Keycloak     │
              │  (IdP — OIDC)   │
              └─────────────────┘
```

---

## Tech Stack Aceita 🛠️

| Camada          | Tecnologia                                                        |
| --------------- | ----------------------------------------------------------------- |
| **Runtime**     | Bun (latest)                                                      |
| **Backend**     | NestJS + TypeScript (strict mode)                                 |
| **Banco**       | PostgreSQL 18+ com ORM (MikroORM, Prisma ou TypeORM)              |
| **Mensageria**  | RabbitMQ, Kafka Ou AWS SQS (Via LocalStack)                       |
| **API Gateway** | Kong ou AWS API Gateway                                           |
| **IdP**         | Keycloak (preferido), Auth0 ou Okta                               |
| **WebSocket**   | `@nestjs/websockets` + `socket.io` ou `ws`                        |
| **Frontend**    | Next.js, Vite ou Tanstack Start                                   |
| **Estilo**      | Tailwind CSS v4 + shadcn/ui                                       |
| **Estado**      | TanStack Query (server state) + Zustand ou Context (client state) |
| **Testes**      | Bun test runner ou Vitest                                         |
| **Docs**        | Swagger / OpenAPI (`@nestjs/swagger`)                             |
| **Infra**       | Docker Compose                                                    |

---

## Modelo de Domínio 🧩

O sistema é dividido em dois bounded contexts:

### Game Service

Responsável pelo ciclo de vida da rodada, apostas, lógica de crash, provably fair e WebSocket.

- **Round** — Agregado principal. Gerencia o ciclo de vida completo de uma rodada.
- **Bet** — Aposta de um jogador em uma rodada.
- **Crash Point** — Multiplicador pré-determinado onde a rodada termina (gerado via algoritmo provably fair).

Cabe a você modelar os estados, transições, invariantes e regras de negócio de cada entidade.

### Wallet Service

Responsável pela carteira do jogador: saldo, operações de crédito e débito.

- **Wallet** — Uma por jogador. **Nunca use ponto flutuante para dinheiro** — use centavos inteiros (`BIGINT`), `NUMERIC` ou biblioteca Decimal.

### Comunicação entre serviços

Game e Wallet se comunicam **assincronamente via RabbitMQ/SQS**. Você deve projetar os eventos, fluxos e estratégias de compensação necessários para garantir consistência entre os serviços.

O design dessa comunicação é **parte central da avaliação**.

---

## Algoritmo Provably Fair 🔐

O crash point de cada rodada deve ser **verificável pelo jogador** — garantindo que o resultado foi pré-determinado e não manipulado após as apostas.

Pesquise como algoritmos provably fair funcionam em crash games. Conceitos relevantes: hash chains, HMAC, seeds, house edge. O jogador deve ser capaz de verificar independentemente o crash point de qualquer rodada passada.

A implementação desse algoritmo (geração, cálculo e verificação) faz parte da avaliação.

---

## Referência da API 📡

Todos os endpoints são acessados via **Kong** (`http://localhost:8000`).

### REST

#### Wallet Service — `/wallets`

| Método | Endpoint      | Auth | Descrição                                |
| ------ | ------------- | ---- | ---------------------------------------- |
| `POST` | `/wallets`    | Sim  | Cria carteira para o jogador autenticado |
| `GET`  | `/wallets/me` | Sim  | Retorna carteira e saldo do jogador      |

> Crédito e débito **não** são expostos via REST — acontecem via message broker.

#### Game Service — `/games`

| Método | Endpoint                        | Auth | Descrição                                  |
| ------ | ------------------------------- | ---- | ------------------------------------------ |
| `GET`  | `/games/rounds/current`         | Não  | Estado da rodada atual com apostas         |
| `GET`  | `/games/rounds/history`         | Não  | Histórico paginado de rodadas              |
| `GET`  | `/games/rounds/:roundId/verify` | Não  | Dados de verificação provably fair         |
| `GET`  | `/games/bets/me`                | Sim  | Histórico de apostas do jogador (paginado) |
| `POST` | `/games/bet`                    | Sim  | Fazer aposta na rodada atual               |
| `POST` | `/games/bet/cashout`            | Sim  | Sacar no multiplicador atual               |

### WebSocket

A conexão WebSocket é usada exclusivamente para **comunicação do servidor para o cliente** (push de eventos em tempo real). Todas as ações do jogador (apostar, sacar) são feitas via REST.

Você deve projetar os eventos que o servidor emite para manter todos os clientes sincronizados em tempo real. Considere quais informações o frontend precisa receber para:

- Saber quando uma nova rodada começa e quando a fase de apostas termina
- Acompanhar o multiplicador durante a rodada
- Saber quando a rodada crashou (e os dados de verificação)
- Ver as apostas e cash outs dos outros jogadores em tempo real

O design dos eventos WebSocket, seus payloads e a estratégia de sincronização do multiplicador fazem parte da avaliação.

---

## Requisitos do Frontend 🖥️

### Página de Login

Redirect para Keycloak (OIDC authorization code flow). Tratar callback e armazenar tokens.

### Página do Jogo (Principal)

**Gráfico do Crash** — Multiplicador animado subindo de `1.00x`, curva visual, indicação clara do crash, exibição do hash da seed antes da rodada.

**Controles de Aposta** — Input de valor com validação, botão "Apostar" (habilitado só na fase de apostas), botão "Cash Out" (habilitado só durante rodada ativa com aposta pendente, exibindo pagamento potencial), timer de contagem regressiva.

**Apostas da Rodada Atual** — Lista em tempo real de todas as apostas, mostrando username, valor e status. Destacar cash outs.

**Histórico de Rodadas** — Últimos ~20 crash points, com código de cores (vermelho = crash baixo, verde = crash alto).

**Info do Jogador** — Saldo atual em destaque, username (do JWT).

### UI/UX

- **Dark mode** — Estética de cassino (fundo escuro, acentos vibrantes/neon)
- **Responsivo** — Desktop e mobile
- **Animações** — Curva suave, feedback de cashout, animação de crash
- **Loading states** — Skeletons ou spinners
- **Erros** — Toast notifications (saldo insuficiente, erro de rede, etc.)

---

## Infraestrutura e Setup 🐳

### Pré-requisitos

- Bun >= 1.x
- Docker & Docker Compose

### Stack pré-configurada

O repositório já inclui `docker-compose.yml` e arquivos de suporte prontos para uso:

| Serviço        | Imagem                             | Portas                                  |
| -------------- | ---------------------------------- | --------------------------------------- |
| PostgreSQL     | `postgres:18.3-alpine`             | `5432` (databases: `games` e `wallets`) |
| RabbitMQ       | `rabbitmq:4.2.4-management-alpine` | `5672` (AMQP), `15672` (UI)             |
| Keycloak       | `quay.io/keycloak/keycloak:26.5.5` | `8080`                                  |
| Kong           | `kong:3.9.1`                       | `8000` (proxy), `8001` (admin)          |
| Frontend       | —                                  | `http://localhost:3000`                 |
| Game Service   | —                                  | `http://localhost:4001`                 |
| Wallet Service | —                                  | `http://localhost:4002`                 |

**Você pode modificar qualquer parte da infra.** Prefere SQS ao invés de RabbitMQ? Outro API Gateway? Outro IdP? Fique à vontade. O único requisito é que **`bun run docker:up` suba tudo sem nenhum passo manual** — incluindo realm do Keycloak, config do Kong e migrations de banco.

### Keycloak

O realm `crash-game` é importado automaticamente no `docker:up`. Nenhuma configuração manual necessária.

| Item           | Valor                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Admin UI       | `http://localhost:8080` (`admin` / `admin`)                                |
| Realm          | `crash-game`                                                               |
| Client ID      | `crash-game-client` (public, PKCE S256)                                    |
| Usuário teste  | `player` / `player123`                                                     |
| OIDC discovery | `http://localhost:8080/realms/crash-game/.well-known/openid-configuration` |

### Scaffold dos serviços de aplicação

**Backend — pronto.** Ambos os serviços já possuem scaffold NestJS funcional com estrutura DDD e rota `GET /health`. Estão integrados ao `docker-compose.yml` e roteados pelo Kong.

| Serviço        | Porta direta | Via Kong                          |
| -------------- | ------------ | --------------------------------- |
| Game Service   | `4001`       | `http://localhost:8000/games/*`   |
| Wallet Service | `4002`       | `http://localhost:8000/wallets/*` |

Cada serviço tem:

- Estrutura de camadas DDD: `domain/`, `application/`, `infrastructure/`, `presentation/`
- `tests/unit/` e `tests/e2e/` prontos para receber os testes
- `packages/` na raiz do monorepo para pacotes compartilhados entre serviços (ex: `@crash/eslint`)

**Frontend — a implementar.** A pasta `frontend/` existe mas o scaffold é responsabilidade do candidato. Use o framework de sua preferência:

- **Vite + React** — opção mais leve, ideal se quiser controle total
- **Next.js** — SSR out-of-the-box, boa escolha para SEO e rotas
- **TanStack Start** — preferido na stack da Jungle Gaming

O placeholder no `docker-compose.yml` está comentado — descomente e adapte com seu `Dockerfile` e porta após criar o scaffold.

### Variáveis de ambiente

As credenciais de infraestrutura (PostgreSQL, RabbitMQ, Keycloak) estão hardcoded no `docker-compose.yml` — são valores de desenvolvimento local, sem necessidade de `.env` no root.

Cada serviço possui `.env.example` com as variáveis necessárias. Copie para `.env` antes de rodar fora do Docker:

```bash
cp services/games/.env.example services/games/.env
cp services/wallets/.env.example services/wallets/.env
```

**Você pode modificar qualquer parte da infra.** Prefere SQS ao invés de RabbitMQ? Outro API Gateway? Outro IdP? Fique à vontade. O único requisito é que **`bun run docker:up` suba tudo**.

### Comandos

```bash
git clone https://github.com/junglegaming/fullstack-challenge
cd fullstack-challenge
bun install
bun run docker:up      # Sobe tudo (infra + serviços + frontend)
bun run docker:down    # Para os containers
bun run docker:prune   # Remove tudo (containers, volumes, imagens)
```

---

## Estrutura do Projeto 📁

> Estrutura sugerida — pode adaptar, desde que mantenha a separação de camadas DDD (domain → application → infrastructure → presentation).

```
fullstack-challenge/
├── services/
│   ├── games/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── tests/ (unit/ + e2e/)
│   │   ├── Dockerfile
│   │   └── package.json
│   └── wallets/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   └── presentation/
│       ├── tests/ (unit/ + e2e/)
│       ├── Dockerfile
│       └── package.json
├── packages/                          # Pacotes compartilhados entre serviços
│   │                                  # Ex: @crash/eslint
│   └── (pacotes serão adicionados aqui)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── stores/
│   ├── Dockerfile
│   └── package.json
├── docker/
│   ├── kong/kong.yml
│   ├── keycloak/realm-export.json
│   └── postgres/init-databases.sh
├── .env
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Testes 🧪

### Obrigatórios

**Unitários (camada de domínio):**

- Ciclo de vida do Round (transições de estado, violação de invariantes)
- Lógica de Bet (cálculo de cashout, transições de status, validação de valor)
- Wallet (crédito, débito, saldo insuficiente, precisão monetária)
- Provably fair (cálculo determinístico do crash point, verificação da hash chain)

**E2E (camada de API):**

- Apostar → multiplicador sobe → cashout → saldo atualizado
- Apostar → crash → aposta perdida
- Erros de validação (saldo insuficiente, aposta dupla, aposta durante rodada ativa)

### Comandos

```bash
cd services/games && bun test tests/unit
cd services/wallets && bun test tests/unit
cd services/games && bun test tests/e2e     # requer docker:up
cd frontend && bun test
```

---

---

## Critérios de Avaliação 📊

### Eliminatórios (todos devem passar)

- `bun run docker:up` sobe tudo sem passos manuais
- Gameplay funciona (apostar → multiplicador → cashout/crash → liquidação)
- Dois serviços separados comunicando via RabbitMQ/SQS
- Sincronização em tempo real (múltiplas abas mostram o mesmo estado)
- Precisão monetária (sem ponto flutuante para dinheiro, saldo nunca negativo)
- Autenticação via IdP (Keycloak/Auth0/Okta) — backend valida JWTs
- Testes existem (unitários + E2E)

### Pontuação

| Critério                | Peso | O que é avaliado                                                                  |
| ----------------------- | ---- | --------------------------------------------------------------------------------- |
| **DDD e Arquitetura**   | 25%  | Bounded contexts, agregados, value objects, separação de camadas, design de sagas |
| **Qualidade de Código** | 20%  | TypeScript strict, estilo consistente, nomes significativos, sem código morto     |
| **Testes**              | 20%  | Cobertura de happy path + cenários de erro                                        |
| **Frontend/UX**         | 15%  | Animações, responsividade, estética de cassino, loading states                    |
| **Provably Fair**       | 10%  | Hash chain, endpoint de verificação, cálculo correto                              |
| **Histórico Git**       | 10%  | Commits atômicos, mensagens claras, progressão lógica                             |

### Desclassificação Imediata

- Aritmética de ponto flutuante para valores monetários
- `bun run docker:up` não funciona
- Sem testes
- Código plagiado/gerado por IA sem entendimento (haverá arguição)

---

## Entrega 📦

| Item                 | Requisito                                                |
| -------------------- | -------------------------------------------------------- |
| **Repositório**      | GitHub público                                           |
| **README**           | Instruções de setup, decisões de arquitetura, trade-offs |
| **Docker Compose**   | `bun run docker:up` sobe tudo                            |
| **Usuário de teste** | Pré-configurado no Keycloak com saldo na carteira        |
| **Prazo**            | **5 dias corridos** a partir do recebimento              |

---

## Bônus ⭐

Não obrigatórios, mas diferenciam candidatos excepcionais:

- **Outbox/Inbox transacional** — Garantia de at-least-once delivery e exactly-once processing
- **Auto cashout** — Jogador define multiplicador alvo para saque automático
- **Auto bet** — Configuração de apostas automáticas com estratégia (ex: Martingale, valor fixo) e stop-loss configurável
- **Observabilidade** — OpenTelemetry + Prometheus + Grafana para métricas de jogo (RTP, volume de apostas, latência de eventos WebSocket)
- **Seed determinística para testes E2E** — Script que popula banco e broker com estado consistente e reproduzível, permitindo simular cenários específicos (ex: crash em 1.5x, sequência de rodadas)
- **Efeitos sonoros** — Feedback de áudio para aposta, cashout, crash
- **Leaderboard** — Top jogadores por lucro (24h/semana)
- **CI pipeline** — GitHub Actions rodando testes no push
- **Rate limiting** — Via Kong ou na aplicação
- **Storybook** — Biblioteca de componentes
- **Fórmula da curva na UI** — Exibir a fórmula para transparência

---

## Dúvidas? ❓

Abra uma issue no seu repositório ou entre em contato com o recrutador.

Boa sorte — e que o multiplicador esteja ao seu favor! 🎲
