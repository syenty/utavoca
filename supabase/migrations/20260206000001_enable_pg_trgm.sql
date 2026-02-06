-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop the existing full-text search index (we'll use trigram instead)
DROP INDEX IF EXISTS idx_artists_name_search;

-- Create trigram indexes for fuzzy matching
-- These allow searches to work even with typos, spacing differences, and partial matches
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);
CREATE INDEX idx_artists_name_en_trgm ON artists USING gin(name_en gin_trgm_ops);
CREATE INDEX idx_artists_name_ko_trgm ON artists USING gin(name_ko gin_trgm_ops);

-- Set the similarity threshold (default is 0.3)
-- Lower = more lenient matching (more results)
-- Higher = stricter matching (fewer results)
-- We'll set it to 0.2 for more flexible search
-- Note: This is a session variable, so it needs to be set in application code as well
