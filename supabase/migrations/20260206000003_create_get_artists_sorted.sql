-- ==========================================
-- Function: get_artists_sorted
-- 복합 정렬로 아티스트 목록 조회
-- 정렬 순서: 즐겨찾기 수 DESC → 등록일 ASC → 노래 수 DESC → 이름 ASC
-- ==========================================

CREATE OR REPLACE FUNCTION get_artists_sorted(p_limit INT DEFAULT 12)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  name_ko TEXT,
  created_at TIMESTAMPTZ,
  favorite_count BIGINT,
  song_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.name_en,
    a.name_ko,
    a.created_at,
    COUNT(DISTINCT f.id) as favorite_count,
    COUNT(DISTINCT s.id) as song_count
  FROM artists a
  LEFT JOIN favorites f ON f.favoritable_type = 'artist' AND f.favoritable_id = a.id
  LEFT JOIN songs s ON s.artist_id = a.id
  GROUP BY a.id, a.name, a.name_en, a.name_ko, a.created_at
  ORDER BY
    COUNT(DISTINCT f.id) DESC,
    a.created_at ASC,
    COUNT(DISTINCT s.id) DESC,
    a.name ASC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_artists_sorted TO authenticated;

-- 함수 테스트
SELECT * FROM get_artists_sorted(5);
