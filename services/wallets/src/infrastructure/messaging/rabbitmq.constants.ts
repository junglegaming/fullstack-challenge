export const GAMES_RMQ_CLIENT = Symbol("GAMES_RMQ_CLIENT");

export function getRabbitMqUrl(): string {
  return process.env.RABBITMQ_URL ?? "amqp://admin:admin@localhost:5672";
}

export function getWalletQueueName(): string {
  return process.env.WALLET_RABBITMQ_QUEUE ?? "wallets.events";
}

export function getGamesQueueName(): string {
  return process.env.GAMES_RABBITMQ_QUEUE ?? "games.events";
}
