-- Tabela para Transactional Outbox Pattern
CREATE TABLE outbox_events (
  id VARCHAR(36) PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  INDEX idx_published (published_at),
  INDEX idx_created (created_at)
);

-- Em uma transação real:
-- BEGIN;
--   UPDATE rounds SET ... WHERE id = ?;
--   INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload, created_at)
--   VALUES (?, ?, ?, ?, ?, NOW());
-- COMMIT;
