FROM node:20-alpine AS base

# Install dependencies
WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install

# Copy source
COPY . .

# Build the Next.js app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_WS_URL=ws://localhost:8000
ENV NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
RUN bun run build

# Production server
EXPOSE 3002
ENV PORT=3002
CMD ["bun", "run", "start"]
