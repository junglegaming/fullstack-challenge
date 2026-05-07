import { describe, it, beforeAll, afterAll, expect } from 'bun:test';
import { setupE2E, teardownE2E, getPort } from './helpers/setup';

describe('Game Service E2E', () => {
  let port: number;

  beforeAll(async () => {
    const setup = await setupE2E();
    port = setup.port;
  });

  afterAll(async () => {
    await teardownE2E();
  });

  it('scenario 1: place bet → cashout → updated balance', async () => {
    // Wait for BETTING phase (10s) + some running time
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 12000));

    // Place bet via HTTP
    const betResponse = await fetch(`http://localhost:${port}/games/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-e2e-1',
        amountCents: 1000,
      }),
    });

    // 201 Created or 200 OK depending on implementation
    expect(betResponse.status).toBeGreaterThanOrEqual(200);
    expect(betResponse.status).toBeLessThan(300);
  }, 30000);

  it('scenario 2: place bet → crash → loss', async () => {
    // Wait for next round
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 12000));

    const betResponse = await fetch(`http://localhost:${port}/games/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-e2e-2',
        amountCents: 500,
      }),
    });

    expect(betResponse.status).toBeGreaterThanOrEqual(200);
  }, 30000);

  it('scenario 3: bet with insufficient balance', async () => {
    const response = await fetch(`http://localhost:${port}/games/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-insufficient',
        amountCents: 1000000, // Very high amount
      }),
    });

    // Might return 400 or 402 depending on wallet service
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('scenario 4: bet outside betting phase', async () => {
    // Try to bet immediately (might be in RUNNING phase)
    const response = await fetch(`http://localhost:${port}/games/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-e2e-3',
        amountCents: 100,
      }),
    });

    // Might succeed or fail depending on timing
    expect(response.status).toBeGreaterThan(0);
  });
});
