FROM oven/bun:1-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
RUN bun install && bunx prisma generate

COPY . .

RUN chmod +x docker-entrypoint.sh

EXPOSE 4002

ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
CMD ["bun", "run", "src/main.ts"]
