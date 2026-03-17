FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

EXPOSE 4002

CMD ["bun", "run", "src/main.ts"]
