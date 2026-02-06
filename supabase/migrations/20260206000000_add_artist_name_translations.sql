-- Add translation fields to artists table
ALTER TABLE artists
ADD COLUMN name_en TEXT,
ADD COLUMN name_ko TEXT;

-- Add indexes for search performance
CREATE INDEX idx_artists_name_en ON artists(name_en);
CREATE INDEX idx_artists_name_ko ON artists(name_ko);

-- Create a text search index for multi-language search
CREATE INDEX idx_artists_name_search ON artists USING gin(
  to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(name_en, '') || ' ' || COALESCE(name_ko, ''))
);

-- Add comment
COMMENT ON COLUMN artists.name_en IS 'Artist name in English (romanized)';
COMMENT ON COLUMN artists.name_ko IS 'Artist name in Korean (for search)';
