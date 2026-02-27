-- Embedding cache for AI-powered job matching
-- Stores OpenAI text-embedding-3-small vectors (1536 dimensions)
-- keyed by normalized text content for reuse across requests

CREATE TABLE IF NOT EXISTS embedding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_content TEXT UNIQUE NOT NULL,
  embedding FLOAT8[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_embedding_cache_text ON embedding_cache(text_content);
