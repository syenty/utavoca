-- ==========================================
-- Update BUMP OF CHICKEN - ray vocabs
-- with validated data from Claude Sonnet 4.5
-- ==========================================

DO $$
DECLARE
  song_id_var UUID;
BEGIN
  -- Get the song ID for 'ray' by BUMP OF CHICKEN
  SELECT s.id INTO song_id_var
  FROM songs s
  JOIN artists a ON s.artist_id = a.id
  WHERE s.title = 'ray' AND a.name = 'BUMP OF CHICKEN';

  -- Update vocabs with validated data (46 words)
  UPDATE songs
  SET vocabs = '[
    {"name": "お別れ", "meaning": "헤어짐", "pronunciation": "owakare"},
    {"name": "悲しい", "meaning": "슬픈", "pronunciation": "kanashii"},
    {"name": "光", "meaning": "빛", "pronunciation": "hikari"},
    {"name": "封じ込める", "meaning": "잠그다", "pronunciation": "fujikomeru"},
    {"name": "踵", "meaning": "발꿈치", "pronunciation": "kakato"},
    {"name": "透明", "meaning": "투명한", "pronunciation": "toumei"},
    {"name": "彗星", "meaning": "혜성", "pronunciation": "suisei"},
    {"name": "唄", "meaning": "노래", "pronunciation": "uta"},
    {"name": "寂しい", "meaning": "외로운", "pronunciation": "sabishii"},
    {"name": "正常", "meaning": "정상", "pronunciation": "seijou"},
    {"name": "異常", "meaning": "비정상", "pronunciation": "ijou"},
    {"name": "考える", "meaning": "생각하다", "pronunciation": "kangaeru"},
    {"name": "暇", "meaning": "틈", "pronunciation": "hima"},
    {"name": "大変", "meaning": "힘든", "pronunciation": "taihen"},
    {"name": "楽しい", "meaning": "즐거운", "pronunciation": "tanoshii"},
    {"name": "忘れる", "meaning": "잊다", "pronunciation": "wasureru"},
    {"name": "消える", "meaning": "사라지다", "pronunciation": "kieru"},
    {"name": "理想", "meaning": "이상", "pronunciation": "risou"},
    {"name": "現実", "meaning": "현실", "pronunciation": "genjitsu"},
    {"name": "思い出", "meaning": "추억", "pronunciation": "omoide"},
    {"name": "軌跡", "meaning": "궤적", "pronunciation": "kiseki"},
    {"name": "輝き", "meaning": "반짝임", "pronunciation": "kagayaki"},
    {"name": "影", "meaning": "그림자", "pronunciation": "kage"},
    {"name": "伸ばす", "meaning": "뻗다", "pronunciation": "nobasu"},
    {"name": "時々", "meaning": "이따금씩", "pronunciation": "tokidoki"},
    {"name": "熱", "meaning": "열", "pronunciation": "netsu"},
    {"name": "眠る", "meaning": "잠들다", "pronunciation": "nemuru"},
    {"name": "夢", "meaning": "꿈", "pronunciation": "yume"},
    {"name": "解る", "meaning": "알다", "pronunciation": "wakaru"},
    {"name": "会う", "meaning": "만나다", "pronunciation": "au"},
    {"name": "晴天", "meaning": "맑은 하늘", "pronunciation": "seiten"},
    {"name": "終わる", "meaning": "끝나다", "pronunciation": "owaru"},
    {"name": "暗闇", "meaning": "어둠", "pronunciation": "kurayami"},
    {"name": "星", "meaning": "별", "pronunciation": "hoshi"},
    {"name": "思い浮かべる", "meaning": "떠올리다", "pronunciation": "omoiukaberu"},
    {"name": "銀河", "meaning": "은하", "pronunciation": "ginga"},
    {"name": "泣く", "meaning": "울다", "pronunciation": "naku"},
    {"name": "靴", "meaning": "신발", "pronunciation": "kutsu"},
    {"name": "新しく", "meaning": "새롭게", "pronunciation": "atarashiku"},
    {"name": "伝える", "meaning": "전하다", "pronunciation": "tsutaeru"},
    {"name": "恐らく", "meaning": "아마", "pronunciation": "osoraku"},
    {"name": "ありきたり", "meaning": "흔히 있는", "pronunciation": "arikitari"},
    {"name": "繋がる", "meaning": "이어지다", "pronunciation": "tsunagaru"},
    {"name": "確かめる", "meaning": "확인하다", "pronunciation": "tashikameru"},
    {"name": "生きる", "meaning": "살아가다", "pronunciation": "ikiru"}
  ]'::jsonb
  WHERE id = song_id_var;

  -- Log the update
  RAISE NOTICE 'Updated vocabs for song ID: %', song_id_var;
END $$;

-- Verify the update
SELECT
  s.title,
  a.name as artist_name,
  jsonb_array_length(s.vocabs) as vocab_count,
  s.vocabs
FROM songs s
JOIN artists a ON s.artist_id = a.id
WHERE s.title = 'ray' AND a.name = 'BUMP OF CHICKEN';
