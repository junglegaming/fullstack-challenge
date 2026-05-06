# Desafio Full-stack - Crash Game 🎮

## 🚀 Implementação da Solução

Esta é uma implementação completa do desafio Crash Game da Jungle Gaming, apresentando uma aplicação full-stack com arquitetura DDD, jogabilidade em tempo real e algoritmo “provably fair”.

### Início Rápido

```bash
# Clone and setup
git clone https://github.com/Sacul-Lucas/Lucas-de-Matos-junglegamingfullstack-challenge.git
cd desafioJungleGaming
bun install

# Start all services (databases, message broker, auth, backend, frontend)
bun run docker:up
```

Acesse a aplicação:
- **Frontend**: http://localhost:3002
- **Games API**: http://localhost:3000 (WebSocket disponível)
- **Wallet API**: http://localhost:3001
- **Keycloak**: http://localhost:8080 (admin/admin)
- **RabbitMQ**: http://localhost:15672 (guest/guest)

### Stack Tecnológica Implementada

| Camada | Tecnologia |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand, Framer Motion |
| **Backend** | NestJS, TypeScript strict mode, DDD architecture |
| **Database** | PostgreSQL 18+ com MikroORM (Wallet) e TypeORM (Games) |
| **Messaging** | RabbitMQ + Outbox/Inbox patterns |
| **Auth** | Keycloak OIDC + PKCE S256 |
| **Real-time** | Socket.io (WebSocket) |
| **Tests** | Bun test runner (142 unit tests + E2E) |

### Destaques da Arquitetura

- **DDD Bounded Contexts**: Serviços separados de Game e Wallet com agregados bem definidos (Round, Wallet), entidades (Bet) e value objects (Money, Multiplier, RoundId)
- **Event-Driven**: Integração com RabbitMQ com garantia de entrega at-least-once via padrão Outbox
- **Provably Fair**: Geração do ponto de crash baseada em HMAC-SHA256 com verificação por cadeia de hash
- **BigInt Cents**: Todos os valores monetários usam centavos inteiros (sem ponto flutuante)
- **Real-time Sync**: Eventos WebSocket para atualizações de multiplicador, apostas e cashouts

### Principais Decisões de Implementação

1. **Next.js em vez de Vite**: Escolhido o App Router do Next.js por melhor SEO, rotas de API integradas e server components
2. **Tailwind v4 + PostCSS**: Versão mais recente do Tailwind com configuração simplificada
3. **Zustand em vez de Context API**: Gerenciamento de estado leve para o estado do jogo (multiplicador, status, apostas)
4. **TanStack Query**: Gerenciamento de estado do servidor para saldo da carteira e histórico de apostas
5. **RabbitMQ Real**: Integração real com amqplib (não simulada)
6. **JWT Auth**: Serviço de Games valida tokens do Keycloak (não existia antes, agora implementado)