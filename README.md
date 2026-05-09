# 🎮 Crash Game

Um crash game fullstack moderno construído com foco em **alta performance**, **microsserviços**, **tempo real** e **arquitetura orientada a eventos** utilizando o ecossistema **Bun** de ponta a ponta.

---

# 🚀 Quick Start

## 📋 Pré-requisitos

- Docker & Docker Desktop
- Bun instalado localmente

### Instalação do Bun (Windows)

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

---

# ⚡ Instalação

## 1. Instale as dependências

Na raiz do monorepo:

```bash
bun install
```

---

## 2. Inicie toda a aplicação

```bash
bun run start:all
```

Esse comando automaticamente:

- Inicializa PostgreSQL
- Inicializa RabbitMQ
- Inicializa Keycloak
- Inicializa Kong Gateway
- Aguarda estabilização dos serviços
- Inicia frontend e microsserviços em paralelo
- Exibe logs coloridos no terminal

---

## 🌐 Acesse a aplicação

| Serviço | URL | Credenciais |
|---|---|---|
| Frontend | http://localhost:5174 | — |
| Keycloak | http://localhost:8080 | admin / admin |
| RabbitMQ | http://localhost:15672 | admin / admin |

> O frontend pode utilizar a porta `5173` caso esteja disponível.

---

# 🏗️ Arquitetura

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime & Package Manager | Bun |
| Frontend | React + Zustand + TailwindCSS + Socket.io |
| Backend Services | NestJS v11 + TypeScript |
| API Gateway | Kong 3.9 |
| Autenticação | Keycloak 26.5 |
| Message Broker | RabbitMQ 4.2 |
| Banco de Dados | PostgreSQL 18 |
| ORM | Prisma |

---

# 🧩 Arquitetura do Sistema

```text
                      ┌───────────────────────┐
                      │  Browser (5174)       │
                      └───────────┬───────────┘
                                  │ HTTP / WS
                                  ▼
                      ┌───────────────────────┐
                      │   Kong Gateway (8000) │
                      └───────────┬───────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼

┌──────────────────┐                     ┌──────────────────┐
│  @crash/games    │  RabbitMQ Events    │ @crash/wallets   │
│  Port: 4001      │ ─────────────────▶ │ Port: 4002       │
└────────┬─────────┘                     └────────┬─────────┘
         │                                         │
         ▼                                         ▼
┌──────────────────┐                     ┌──────────────────┐
│ PostgreSQL       │                     │ PostgreSQL       │
└──────────────────┘                     └──────────────────┘
```

---

# 📦 Estrutura do Monorepo

```bash
fullstack-challenge/
│
├── frontend/                  # Frontend React + Vite
│
├── services/
│   ├── game-service/          # Microsserviço de jogo
│   └── wallet-service/        # Microsserviço de carteira
│
├── docker/
│   ├── keycloak/              # Configurações do Realm
│   ├── kong/                  # Configurações do Gateway
│   └── postgres/              # Inicialização dos bancos
│
├── package.json               # Scripts globais do Bun
└── docker-compose.yml         # Infraestrutura completa
```

---

# 🎮 Engine do Jogo

## Arquitetura

A engine opera através de uma **única instância em memória**, responsável por controlar todo o ciclo do jogo em tempo real.

```text
┌─────────────────────────────────┐
│   Game Engine (Async Loop)      │
│  - Timer Management             │
│  - Event Dispatching            │
│  - Crash Calculation            │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│   WebSocket Broadcasts          │
│  - Real-time Multiplayer        │
│  - Crash Notifications          │
└─────────────────────────────────┘
```

---

## Fluxo da Engine

### 1️⃣ Inicialização

Ao iniciar o serviço `@crash/games`, uma instância única da engine é criada.

---

### 2️⃣ Loop Principal

A engine executa continuamente de forma assíncrona gerenciando:

- Timer do jogo
- Multiplicadores
- Detecção de crash
- Eventos do sistema

---

### 3️⃣ Mensageria

Eventos são publicados via RabbitMQ para comunicação entre serviços.

---

### 4️⃣ Tempo Real

Socket.io transmite eventos instantaneamente para todos os jogadores conectados.

> Atualmente a engine opera em memória. Persistência distribuída foi planejada para cenários de escala horizontal.

---

# 🎯 Fluxo de Apostas

## 1️⃣ Jogador realiza aposta

O frontend envia a requisição para:

```text
@crash/games
```

---

## 2️⃣ Evento publicado no RabbitMQ

O serviço publica um evento contendo:

- ID do jogador
- Valor da aposta
- Dados da rodada

---

## 3️⃣ Serviço de carteira processa

O serviço:

```text
@crash/wallets
```

consome a fila e:

- valida saldo
- processa transação
- salva no banco

Utilizando:

```ts
BigInt
```

para evitar problemas de precisão decimal.

---

## 4️⃣ Atualização em tempo real

O novo saldo é sincronizado via:

- WebSockets
- Socket.io

em todas as abas conectadas do jogador.

---

# 🧠 Padrões Arquiteturais

## Domain-Driven Design (DDD)

O projeto aplica uma abordagem híbrida baseada em DDD.

---

## ✍️ Escritas (Commands)

Para operações com regras de negócio complexas:

```text
Route → Command Handler → Entity → Repository → Database
```

### Exemplos

- Criar aposta
- Sacar winnings
- Processar crash

---

## 📖 Leituras (Queries)

Para consultas performáticas:

```text
Route → Query Handler → Direct SQL/View → Database
```

### Exemplos

- Histórico de apostas
- Rankings
- Consulta de saldo

### Benefício

Queries diretas reduzem overhead de ORM e aumentam performance de leitura.

---

# 🔐 Fluxo de Autenticação

```text
1. User → Frontend (Login)
    ↓
2. Frontend → Keycloak (OAuth2 + PKCE)
    ↓
3. Keycloak → Session
    ↓
4. Frontend → Kong Gateway
    ↓
5. Kong → Microsserviços (JWT válido)
```

---

# ✨ Recursos Extras

- ✅ Auto Cashout
- ✅ Comunicação em tempo real
- ✅ RabbitMQ Event-Driven
- ✅ Rate Limiting via Kong
- ✅ Seed determinística para testes E2E
- ✅ Testes E2E com Playwright
- ✅ Arquitetura escalável
- ✅ Atualização de saldo em múltiplas abas
- ✅ Engine assíncrona de alta performance

---

# 🛠️ Scripts Úteis

Todos os comandos devem ser executados na raiz do projeto.

| Comando | Descrição |
|---|---|
| `bun run start:all` | Sobe toda infraestrutura + frontend + microsserviços |
| `bun run docker:up` | Sobe apenas os containers |
| `bun run docker:down` | Derruba toda infraestrutura |
| `bun run dev` | Executa frontend e serviços sem Docker |

---

# ⚙️ Variáveis de Ambiente

## Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
```

---

## Microsserviços

```env
DATABASE_URL=postgresql://admin:admin@postgres:5432/games
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
NODE_ENV=development
```

---

# 🚨 Troubleshooting

| Problema | Solução |
|---|---|
| `Invalid parameter: redirect_uri` | Liberar porta 5173 e reiniciar aplicação |
| PostgreSQL não inicia no Windows | Converter line endings do script init |
| Socket.io não conecta | Verificar configuração do Kong |
| Login falha no Keycloak | Validar variáveis de ambiente |

---

## Correção rápida da porta 5173 no Windows

```bash
taskkill //F //PID $(netstat -ano | grep 5173 | awk '{print $5}' | head -n 1)
```

Depois execute novamente:

```bash
bun run start:all
```

---

# 🔐 Painéis Administrativos

## Keycloak

```text
http://localhost:8080
```

Usuário: `admin`  
Senha: `admin`

---

## RabbitMQ

```text
http://localhost:15672
```

Usuário: `admin`  
Senha: `admin`

---

# 📚 Conceitos Aplicados

- Event-Driven Architecture
- Microsserviços
- WebSockets
- OAuth2 / OpenID Connect
- API Gateway Pattern
- DDD
- CQRS simplificado
- Sistemas Distribuídos
- Processamento Assíncrono

---

# 👨‍💻 Autor

Desenvolvido com ⚡ por **Ricardo João do Nascimento Filho**