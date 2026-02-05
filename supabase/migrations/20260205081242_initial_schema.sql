-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 관리자 관리 데이터
-- ==========================================

-- Artists (가수)
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums (앨범) - 선택적 테이블
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  release_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Songs (노래)
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  vocabs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JSONB 검색 최적화를 위한 인덱스
CREATE INDEX idx_songs_vocabs_gin ON songs USING GIN (vocabs jsonb_path_ops);
CREATE INDEX idx_songs_artist_id ON songs(artist_id);
CREATE INDEX idx_albums_artist_id ON albums(artist_id);

-- ==========================================
-- 사용자 데이터
-- ==========================================

-- Favorites (즐겨찾기)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  favoritable_type TEXT NOT NULL CHECK (favoritable_type IN ('artist', 'song')),
  favoritable_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, favoritable_type, favoritable_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_lookup ON favorites(user_id, favoritable_type, favoritable_id);

-- Wrong Vocabs (틀린 단어 / 복습 노트)
CREATE TABLE wrong_vocabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  vocab_name TEXT NOT NULL,           -- 일본어 단어 (愛, 夢 등)
  vocab_meaning TEXT NOT NULL,        -- 한국어 뜻 (사랑, 꿈 등)
  vocab_pronunciation TEXT NOT NULL,  -- 로마자 발음 (ai, yume 등)
  wrong_count INTEGER DEFAULT 1,
  last_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id, vocab_name)
);

CREATE INDEX idx_wrong_vocabs_user ON wrong_vocabs(user_id);
CREATE INDEX idx_wrong_vocabs_lookup ON wrong_vocabs(user_id, song_id, vocab_name);

-- ==========================================
-- Row Level Security (RLS) 정책
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_vocabs ENABLE ROW LEVEL SECURITY;

-- Artists: 모두 조회 가능 (읽기 전용)
CREATE POLICY "Anyone can view artists"
  ON artists FOR SELECT
  USING (true);

-- Albums: 모두 조회 가능 (읽기 전용)
CREATE POLICY "Anyone can view albums"
  ON albums FOR SELECT
  USING (true);

-- Songs: 모두 조회 가능 (읽기 전용)
CREATE POLICY "Anyone can view songs"
  ON songs FOR SELECT
  USING (true);

-- Favorites: 본인 데이터만 CRUD
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Wrong Vocabs: 본인 데이터만 CRUD
CREATE POLICY "Users can view their own wrong_vocabs"
  ON wrong_vocabs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wrong_vocabs"
  ON wrong_vocabs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wrong_vocabs"
  ON wrong_vocabs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wrong_vocabs"
  ON wrong_vocabs FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 유용한 함수들
-- ==========================================

-- 즐겨찾기된 가수/노래의 모든 vocabs 조회 함수
CREATE OR REPLACE FUNCTION get_favorite_vocabs(p_user_id UUID)
RETURNS TABLE (
  vocab_name TEXT,
  vocab_meaning TEXT,
  vocab_pronunciation TEXT,
  song_id UUID,
  song_title TEXT,
  artist_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v->>'name' as vocab_name,
    v->>'meaning' as vocab_meaning,
    v->>'pronunciation' as vocab_pronunciation,
    s.id as song_id,
    s.title as song_title,
    a.name as artist_name
  FROM favorites f
  LEFT JOIN songs s ON (
    (f.favoritable_type = 'song' AND f.favoritable_id = s.id) OR
    (f.favoritable_type = 'artist' AND f.favoritable_id = s.artist_id)
  )
  LEFT JOIN artists a ON s.artist_id = a.id
  CROSS JOIN LATERAL jsonb_array_elements(s.vocabs) v
  WHERE f.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 복습용 틀린 단어 조회 함수
CREATE OR REPLACE FUNCTION get_wrong_vocabs_for_review(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  vocab_name TEXT,
  vocab_meaning TEXT,
  vocab_pronunciation TEXT,
  wrong_count INTEGER,
  song_title TEXT,
  artist_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wv.vocab_name,
    wv.vocab_meaning,
    wv.vocab_pronunciation,
    wv.wrong_count,
    s.title as song_title,
    a.name as artist_name
  FROM wrong_vocabs wv
  JOIN songs s ON wv.song_id = s.id
  JOIN artists a ON s.artist_id = a.id
  WHERE wv.user_id = p_user_id
  ORDER BY wv.wrong_count DESC, wv.last_wrong_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
