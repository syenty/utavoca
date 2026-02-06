-- Create a function for fuzzy artist search using pg_trgm
CREATE OR REPLACE FUNCTION search_artists_fuzzy(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  name_ko TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.name_en,
    a.name_ko,
    a.image_url,
    a.created_at,
    GREATEST(
      COALESCE(similarity(a.name, search_query), 0),
      COALESCE(similarity(a.name_en, search_query), 0),
      COALESCE(similarity(a.name_ko, search_query), 0)
    ) as similarity_score
  FROM artists a
  WHERE
    a.name ILIKE '%' || search_query || '%' OR
    a.name_en ILIKE '%' || search_query || '%' OR
    a.name_ko ILIKE '%' || search_query || '%' OR
    similarity(COALESCE(a.name, ''), search_query) > 0.2 OR
    similarity(COALESCE(a.name_en, ''), search_query) > 0.2 OR
    similarity(COALESCE(a.name_ko, ''), search_query) > 0.2
  ORDER BY similarity_score DESC, a.name
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Create a function for fuzzy song search
CREATE OR REPLACE FUNCTION search_songs_fuzzy(search_query TEXT)
RETURNS TABLE (
  id UUID,
  artist_id UUID,
  album_id UUID,
  title TEXT,
  summary TEXT,
  vocabs JSONB,
  created_at TIMESTAMPTZ,
  artist_name TEXT,
  artist_name_en TEXT,
  artist_name_ko TEXT,
  artist_image_url TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.artist_id,
    s.album_id,
    s.title,
    s.summary,
    s.vocabs,
    s.created_at,
    a.name as artist_name,
    a.name_en as artist_name_en,
    a.name_ko as artist_name_ko,
    a.image_url as artist_image_url,
    GREATEST(
      COALESCE(similarity(s.title, search_query), 0),
      COALESCE(similarity(a.name, search_query), 0),
      COALESCE(similarity(a.name_en, search_query), 0),
      COALESCE(similarity(a.name_ko, search_query), 0)
    ) as similarity_score
  FROM songs s
  JOIN artists a ON s.artist_id = a.id
  WHERE
    s.title ILIKE '%' || search_query || '%' OR
    a.name ILIKE '%' || search_query || '%' OR
    a.name_en ILIKE '%' || search_query || '%' OR
    a.name_ko ILIKE '%' || search_query || '%' OR
    similarity(COALESCE(s.title, ''), search_query) > 0.2 OR
    similarity(COALESCE(a.name, ''), search_query) > 0.2 OR
    similarity(COALESCE(a.name_en, ''), search_query) > 0.2 OR
    similarity(COALESCE(a.name_ko, ''), search_query) > 0.2
  ORDER BY similarity_score DESC, s.title
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
