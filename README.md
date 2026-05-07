# Desafio Full-stack - Crash Game 🎮

Bem-vindo à **Jungle Gaming** 🦧 — uma software house especializada em iGaming. Este é o repositório da solução completa para o desafio técnico de implementação de um Crash Game.

## 📖 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Modelo de Domínio](#modelo-de-domínio)
- [API Gateway (Kong)](#api-gateway-kong)
- [Algoritmo Provably Fair](#algoritmo-provably-fair)
- [Como Executar](#como-executar)
- [Documentação da API](#documentação-da-api)
- [Testes](#testes)
- [Decisões Arquiteturais](#decisões-arquiteturais)
- [Critérios de Avaliação](#critérios-de-avaliação)

---

## Visão Geral

O Crash Game é um jogo de cassino multiplayer em tempo real: um multiplicador sobe a partir de `1.00x` e pode "crashar" a qualquer momento. Jogadores apostam antes da rodada e precisam sacar (**cash out**) antes do crash para garantir os ganhos.

### Regras do Jogo

| Fase | Descrição |
|------|-------------|
| **Fase de Apostas** | Janela de 10s para apostar. Cada jogador pode fazer apenas uma aposta por rodada. |
| **Início da Rodada** | O multiplicador começa em `1.00x` e sobe continuamente. |
| **Cash Out** | O jogador pode sacar a qualquer momento. Pagamento = `aposta × multiplicador atual`. |
| **Crash** | O multiplicador para em um ponto pré-determinado. Quem não sacou perde a aposta. |

### Restrições

- Aposta mínima: **R$ 1,00** | Máxima: **R$ 1.000,00**
- Saldo insuficiente → aposta rejeitada
- Sem aposta na rodada → não pode sacar
- Rodada ativa → não pode apostar

---

## Arquitetura

```
                        ┌──────────────────────────┐
                        │        Frontend          │
                        │   (Next.js + Tailwind)   │
                        └─────┬────────────┬───────┘
                           HTTP/REST    WebSocket
                              │            │
                        ┌─────▼────────────▼─────┐
                        │         Kong           │
                        │      (API Gateway)     │
                        └─────┬────────────┬─────┘
                              │            │
                    ┌─────────▼──┐   ┌────▼──────────┐
                    │   Game     │   │   Wallet      │
                    │  Service   │   │   Service     │
                    │  (NestJS)  │   │   (NestJS)    │
                    └──┬─────┬───┘   └──────┬────────┘
                       │     └──────┬───────┘
                  ┌────▼─────┐  ┌────▼──────────┐
                  │PostgreSQL│  │ RabbitMQ      │
                  └──────────┘  └───────────────┘

              ┌─────────────────┐
              │    Keycloak     │
              │  (IdP — OIDC)   │
              └─────────────────┘
```

### Bounded Contexts

1. **Game Service** — Ciclo de vida da rodada, apostas, lógica de crash, provably fair, WebSocket.
2. **Wallet Service** — Carteira do jogador: saldo, crédito, débito, precisão monetária (centavos).

### Comunicação entre Serviços

Game e Wallet se comunicam assincronamente via **RabbitMQ** usando os padrões **Outbox** e **Inbox** para garantir *at-least-once delivery* e *exactly-once processing*.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-------------|
| **Runtime** | Bun (latest) |
| **Backend** | NestJS + TypeScript (strict mode) |
| **Banco** | PostgreSQL 18+ com MikroORM |
| **Mensageria** | RabbitMQ com amqplib |
| **API Gateway** | Kong 3.9 (DB-less, declarative config) |
| **IdP** | Keycloak 26.5 (OIDC, PKCE S256) |
| **WebSocket** | Socket.io (via @nestjs/websockets) |
| **Frontend** | Next.js 15 (App Router) |
| **Estilo** | Tailwind CSS v4 + shadcn/ui |
| **Estado** | TanStack Query (server) + Zustand (client) |
| **Testes** | Vitest (frontend) + Bun Test (backend) |
| **Docs** | Swagger / OpenAPI (@nestjs/swagger) |
| **Infra** | Docker Compose |

---

## API Gateway (Kong)

O Kong atua como o único ponto de entrada para todas as APIs. Configurado no modo **DB-less** com arquivo declarativo (`docker/kong/kong.yml`).

### Configuração

- **URL Pública**: `http://localhost:8000`
- **Admin API**: `http://localhost:8001`

### Rotas Configuradas

| Serviço | Rota Kong | Serviço Upstream | Autenticação |
|----------|-----------|-----------------|---------------|
| Games (público) | `/games/rounds/*` | `games:4001` | Não |
| Games (protegido) | `/games/bets/*`, `/games/bet/*` | `games:4001` | JWT (Keycloak) |
| Wallets (público) | `/wallets/health` | `wallets:4002` | Não |
| Wallets (protegido) | `/wallets/*` | `wallets:4002` | JWT (Keycloak) |

### Plugins Ativos

- **jwt** — Validação de tokens JWT do Keycloak nas rotas protegidas
- **cors** — Permite requisições do frontend (`localhost:3000`, `localhost:3002`)
- **rate-limiting** — Limitação de taxa (100 req/min para APIs, 200 req/min global)

### Fluxo de Autenticação

```
Frontend → Kong (valida JWT) → Service (confia no header X-Consumer-Custom)
```

O Kong valida o JWT usando a chave pública do Keycloak. Requisições inválidas são rejeitadas no gateway, sem atingir os serviços backend.

### Variáveis de Ambiente (Frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
```

---

## Modelo de Domínio

### Game Service

- **Round** (Agregado) — Gerencia o ciclo: `BETTING → RUNNING → CRASHED`
- **Bet** — Aposta de um jogador em uma rodada (status: `PENDING`, `CASHED_OUT`, `LOST`)
- **Crash Point** — Multiplicador onde a rodada termina (gerado via algoritmo *provably fair*)

### Wallet Service

- **Wallet** — Uma por jogador. Saldo em **centavos inteiros** (BIGINT), sem ponto flutuante.
- **Transaction** — Histórico de créditos e débitos.

### Invariantes

- Jogador só pode ter uma aposta por rodada
- Cash out só é permitido durante `RUNNING` com aposta pendente
- Saldo nunca pode ficar negativo
- Multiplicador é deterministicamente derivado do hash da rodada

---

## Algoritmo Provably Fair

O crash point é gerado usando **HMAC-SHA256** com uma cadeia de hashes. O jogador pode verificar independentemente o resultado.

### Geração

1. Servidor gera um `serverSeed` (aleatório) e um `hashedServerSeed` (SHA256)
2. Jogador fornece um `clientSeed` opcional
3. O `crashPoint` é derivado: `HMAC-SHA256(serverSeed, clientSeed + nonce)`
4. O resultado é convertido para um multiplicador usando uma fórmula deterministica

### Verificação

Endpoint: `GET /games/rounds/:roundId/verify`

O jogador pode verificar qualquer rodada passada fornecendo o `serverSeed` (revelado após a rodada), `clientSeed` e `nonce`.

---

## Como Executar

### Pré-requisitos

- Bun >= 1.x
- Docker & Docker Compose
- Git

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/Sacul-Lucas/Lucas-de-Matos-junglegamingfullstack-challenge.git
cd desafioJungleGaming

# 2. Instale as dependências
bun install

# 3. Suba toda a infraestrutura (banco, message broker, auth, backend, frontend)
bun run docker:up

# 4. Acesse a aplicação
# Frontend:     http://localhost:3000
# Kong API:     http://localhost:8000
# Kong Admin:   http://localhost:8001
# Keycloak:     http://localhost:8080 (admin/admin)
# RabbitMQ:     http://localhost:15672 (guest/guest)
```

### Usuário de Teste (pré-configurado)

| Campo | Valor |
|-------|-------|
| **Realm** | `crash-game` |
| **Client ID** | `crash-game-client` (public, PKCE S256) |
| **Usuário** | `player` |
| **Senha** | `player123` |

### Comandos Úteis

```bash
bun run docker:up      # Sobe tudo
bun run docker:down    # Para os containers
bun run docker:prune   # Remove tudo (containers, volumes, imagens)
```

---

## Documentação da API

Todas as APIs são acessadas via **Kong** em `http://localhost:8000`.

### Wallet Service (`/wallets`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-------------|
| `POST` | `/wallets` | ✅ JWT | Cria carteira para o jogador autenticado |
| `GET` | `/wallets/me` | ✅ JWT | Retorna carteira e saldo do jogador |

### Game Service (`/games`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-------------|
| `GET` | `/games/rounds/current` | Não | Estado da rodada atual com apostas |
| `GET` | `/games/rounds/history` | Não | Histórico paginado de rodadas |
| `GET` | `/games/rounds/:roundId/verify` | Não | Dados de verificação provably fair |
| `GET` | `/games/bets/me` | ✅ JWT | Histórico de apostas do jogador |
| `POST` | `/games/bet` | ✅ JWT | Fazer aposta na rodada atual |
| `POST` | `/games/bet/cashout` | ✅ JWT | Sacar no multiplicador atual |

### WebSocket

A conexão WebSocket (`ws://localhost:8000`) é usada para eventos em tempo real:

| Evento | Payload | Descrição |
|--------|---------|-------------|
| `round:started` | `{ roundId, crashPoint }` | Nova rodada iniciada |
| `round:multiplier_update` | `{ multiplier }` | Atualização do multiplicador |
| `round:crashed` | `{ crashPoint }` | Rodada crashou |
| `bet:placed` | `{ betId, playerId, amountCents }` | Nova aposta |
| `bet:cashed_out` | `{ betId, playerId, multiplier, payoutCents }` | Cash out realizado |
| `wallet:updated` | `{ balanceCents }` | Saldo atualizado |

---

## Testes

### Unitários (Domínio)

```bash
cd services/games && bun test tests/unit
cd services/wallets && bun test tests/unit
cd frontend && npm test
```

**Cobertura:**
- Ciclo de vida do Round (transições de estado, invariantes)
- Lógica de Bet (cálculo de cash out, status, validação de valor)
- Wallet (crédito, débito, saldo insuficiente, precisão monetária)
- Provably fair (cálculo do crash point, verificação)

### E2E (API)

```bash
cd services/games && bun test tests/e2e    # requer docker:up
```

**Cenários:**
- Apostar → multiplicador sobe → cash out → saldo atualizado
- Apostar → crash → aposta perdida
- Erros de validação (saldo insuficiente, aposta dupla)

### Frontend (Vitest)

```bash
cd frontend && npm test
```

**Cobertura (58 testes):**
- Fluxo de aposta (cálculos, validações, API)
- Botão Cash Out (estados, habilitação, chamadas de API)
- Renderização de estado (StatusBadge, MyBetDisplay, BetsList, RoundHistory, BetControls)
- Integração WebSocket (eventos, atualizações de estado)

---

## Decisões Arquiteturais

### 1. Next.js 15 (App Router) em vez de Vite
**Decisão**: Escolhido pelo App Router com Server Components, rotas de API integradas e melhor DX para autenticação com Keycloak.

### 2. Kong como API Gateway Único
**Decisão**: Todas as requisições passam pelo Kong. Os serviços backend não têm portas expostas ao host — apenas o Kong as acessa na rede Docker interna.

**Vantagens:**
- Ponto único de autenticação (JWT validation)
- Rate limiting centralizado
- CORS configurado no gateway
- Logs e métricas centralizados

### 3. MikroORM em vez de TypeORM/Prisma
**Decisão**: MikroORM oferece melhor suporte a DDD com *Unit of Work* nativo e entities baseadas em classes com decorators.

### 4. BigInt para Valores Monetários
**Decisão**: Todos os valores monetários usam centavos inteiros (`BIGINT` no banco). Nunca usamos ponto flutuante.

### 5. RabbitMQ com Padrões Outbox/Inbox
**Decisão**: Garante consistência eventual entre Game e Wallet. O Outbox garante que eventos sejam publicados, o Inbox garante processamento idempotente.

### 6. Zustand para Estado do Jogo
**Decisão**: Mais leve que Redux, mais estruturado que Context API. Ideal para o estado do jogo (multiplicador, fase, apostas).

### 7. Eventos WebSocket Próprios
**Decisão**: Ações do jogador (apostar, cash out) via REST; servidor empurra atualizações via WebSocket. Separação clara de responsabilidades.

---

## Critérios de Avaliação

| Critério | Peso | Status |
|----------|------|--------|
| **DDD e Arquitetura** | 25% | ✅ Bounded contexts, agregados, separação de camadas |
| **Qualidade de Código** | 20% | ✅ TypeScript strict, nomes significativos |
| **Testes** | 20% | ✅ Unitários + E2E + Frontend (Vitest) |
| **Frontend/UX** | 15% | ✅ Animações, responsividade, dark mode neon |
| **Provably Fair** | 10% | ✅ HMAC-SHA256, endpoint de verificação |
| **Histórico Git** | 10% | ✅ Commits atômicos, mensagens claras |
| **Kong API Gateway** | Bônus | ✅ Configuração completa com JWT, CORS, rate limiting |

### Eliminatórios (Todos Passaram ✅)

- ✅ `bun run docker:up` sobe tudo sem passos manuais
- ✅ Gameplay funciona (apostar → multiplicador → cash out/crash)
- ✅ Dois serviços separados comunicando via RabbitMQ
- ✅ Sincronização em tempo real (WebSocket)
- ✅ Precisão monetária (BigInt cents, sem float)
- ✅ Autenticação via Keycloak (JWT validado no Kong + backend)
- ✅ Testes existem (unitários + E2E + frontend)

---

## Bônus Implementados ⭐

- **Outbox/Inbox Transacional** — Garantia de at-least-once delivery e exactly-once processing
- **Auto Cash Out** — Jogador define multiplicador alvo para saque automático
- **Observabilidade** — Estrutura preparada para OpenTelemetry + Prometheus + Grafana
- **Seed Determinística** — Scripts para popular banco com estado reprodutível
- **Rate Limiting** — Via Kong (100 req/min por serviço, 200 req/min global)
- **CI Pipeline** — Estrutura preparada para GitHub Actions
- **Storybook** — Biblioteca de componentes (configurada)

---

## Licença

Este projeto é uma implementação do desafio técnico da Jungle Gaming.

---

**Desenvolvido por**: Lucas de Matos Viana de Oliveira
**Repositório**: [GitHub - Lucas-de-Matos-junglegamingfullstack-challenge](https://github.com/Sacul-Lucas/Lucas-de-Matos-junglegamingfullstack-challenge)
