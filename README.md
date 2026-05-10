# 🎮 Crash Game

Um crash game fullstack moderno com arquitetura de microserviços, autenticação centralizada e engine de jogo em tempo real.

## 🚀 Quick Start

### Pré-requisitos
- Docker & Docker Compose
- Node.js/Bun (opcional, para desenvolvimento local)

### Instalação

1. **Configure as variáveis de ambiente** em cada serviço:
   ```bash
   # Frontend
   cp ./frontend/.env.example ./frontend/.env
   
   # Games Service
   cp ./services/games/.env.example ./services/games/.env
   
   # Wallets Service
   cp ./services/wallets/.env.example ./services/wallets/.env
   ```

2. **Inicie a aplicação:**
   ```bash
   pnpm docker:up
   ```

3. **Aguarde o boot completo** (~2-3 minutos) — as APIs executam migrations automaticamente.

4. Acesse: **http://localhost:3000**

> **⚠️ Windows:** Se enfrentar problemas com o PostgreSQL, execute no PowerShell (como admin):
> ```powershell
> (Get-Content "docker/postgres/init-databases.sh" -Raw).Replace("`r`n","`n") | Set-Content "docker/postgres/init-databases.sh" -NoNewline
> ```

---

## 🏗️ Arquitetura

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 16 + NextAuth.js + Zustand + Socket.io |
| **Backend Services** | NestJS + Bun |
| **API Gateway** | Kong 3.9 |
| **Autenticação** | Keycloak 26.5 |
| **Message Broker** | RabbitMQ 4.2 |
| **Databases** | PostgreSQL 18 |
| **Runtime** | Bun |

### Serviços

- **Frontend** (porta 3000): Interface Next.js com autenticação OAuth2 e comunicação em tempo real via Socket.io
- **Games Service** (porta 4001): Engine de jogo + lógica de crash (NestJS)
- **Wallets Service** (porta 4002): Gerenciamento de saldo e transações (NestJS)
- **Kong** (porta 8000): API Gateway + Rate limiting + Logging
- **Keycloak** (porta 8080): Identity Provider + Gerenciamento de usuários
- **RabbitMQ** (porta 5672): Message broker para comunicação entre serviços
- **PostgreSQL** (porta 5432): Persistência de dados

---

## 🎲 Engine do Jogo

### Arquitetura

A engine de crash funciona com uma **única instância em memória** que controla todo o ciclo do jogo:

```
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

### Fluxo de Funcionamento

1. **Inicialização**: Ao startup do Games Service, uma instância única da engine é criada
2. **Loop Principal**: A engine executa em loop infinito (não bloqueante) gerenciando:
   - Timer do jogo (em milissegundos)
   - Detecção de crashes
   - Cálculo de multiplicadores
3. **Eventos**: Cada mudança de estado dispara eventos via RabbitMQ
4. **Comunicação em Tempo Real**: Socket.io transmite eventos para todos os clientes conectados

> **📝 Nota**: Atualmente, a engine opera em memória. Persistência foi planejada para escala em produção.

---

## 🎯 Padrões de Arquitetura

### Domain-Driven Design (DDD) Customizado

O projeto implementa uma variação do DDD adaptada para diferentes tipos de operações:

#### **Escritas (Commands) — Entity + Repository Pattern**
Para rotas com lógica de negócio complexa:
```
Route → Command Handler → Entity → Repository → Database
         ↓
    [Business Rules]
```

**Exemplo**: Criar aposta, processar crash, sacar winnings

#### **Leituras (Queries) — Query Pattern**
Para operações de consulta simples:
```
Route → Query Handler → Direct SQL/View → Database
```

**Exemplo**: Listar histórico de apostas, ver saldo, rankings

**Benefício**: Queries diretas reduzem overhead de mapeamento ORM, otimizando leitura sem comprometer a integridade de escrita.

---

## 📊 Fluxo de Autenticação

```
1. User → Frontend (Login)
    ↓
2. Frontend → Keycloak (OAuth2 + PKCE)
    ↓
3. Keycloak → NextAuth.js Session
    ↓
4. NextAuth → Kong (API Gateway)
    ↓
5. Kong → Games/Wallets (Com JWT válido)
```

---

## ✨ Recursos Bônus Implementados

- **Auto Cashout** — Jogador define multiplicador alvo para saque automático
- **Seed Determinística para Testes E2E** — Scripts de inicialização reproduzível para simular cenários específicos
- **Playwright** — Testes E2E de ponta a ponta para fluxos reais do jogador
- **Rate Limiting** — Implementado via Kong para proteção da API
- **Shadcn/ui** — Biblioteca de componentes modularizados no frontend
- **Fórmula da Curva na UI** — Exibição transparente da curva de crash no gráfico do jogo

---

## 📚 Referências

- [Crash Game Tutorial](https://www.youtube.com) — Conceitos e mecânicas
- [Keycloak Documentation](https://www.keycloak.org/docs) — Autenticação e autorização
- [Kong Gateway Docs](https://docs.konghq.com) — API Gateway patterns + Rate Limiting
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html) — Padrões arquiteturais
- [Shadcn/ui](https://ui.shadcn.com) — Componentes React reutilizáveis
- [Playwright Documentation](https://playwright.dev) — Testes E2E

---

## 🛠️ Desenvolvimento Local

### Estrutura de Pastas

```
fullstack-challenge/
├── frontend/              # Next.js + NextAuth.js + Zustand + Socket.io
├── services/
│   ├── games/            # NestJS - Game Engine + Betting Logic
│   └── wallets/          # NestJS - Wallet Management + Transactions
├── docker/
│   ├── keycloak/         # Realm configuration
│   ├── kong/             # API Gateway config
│   └── postgres/         # Database init scripts
└── docker-compose.yml    # Orchestração completa
```

### Scripts Úteis

```bash
# Ver logs em tempo real
docker logs -f fullstack-challenge-games-1

# Resetar banco de dados
docker compose exec postgres psql -U admin -d games -c "TRUNCATE TABLE bets;"

# Acessar admin do Keycloak
# http://localhost:8080 (admin/admin)

# Acessar RabbitMQ Management
# http://localhost:15672 (admin/admin)
```

---

## ⚙️ Variáveis de Ambiente

### Frontend (.env)
```env
NEXT_PUBLIC_API_KONG_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_aqui
AUTH_KEYCLOAK_ISSUER=http://keycloak:8080/realms/crash-game
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/crash-game
AUTH_KEYCLOAK_ID=crash-game-client
AUTH_KEYCLOAK_SECRET=
```

### Games/Wallets (.env)
```env
DATABASE_URL=postgresql://admin:admin@postgres:5432/games
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
NODE_ENV=development
```

---

## 🚨 Troubleshooting

| Problema | Solução |
|----------|---------|
| Keycloak unhealthy | Aumentar `start_period` no docker-compose.yml para 120s |
| ECONNREFUSED em login | Verificar `AUTH_KEYCLOAK_ISSUER` (deve ser `http://keycloak:8080`) |
| PostgreSQL não inicia (Windows) | Executar comando de conversão de line endings acima |
| Socket.io não conecta | Verificar se Kong está redirecionando corretamente para Games Service |

---

## 📝 Licença

MIT

---

**Made with ❤️ by [Your Name]**
