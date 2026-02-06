-- ==========================================
-- Sample Song: BUMP OF CHICKEN - ray
-- ==========================================

-- BUMP OF CHICKEN의 ID 찾기 (이미 seed-artists.sql에서 추가됨)
-- 노래 추가
DO $$
DECLARE
  artist_id_var UUID;
BEGIN
  -- BUMP OF CHICKEN의 ID 가져오기
  SELECT id INTO artist_id_var
  FROM artists
  WHERE name = 'BUMP OF CHICKEN';

  -- 노래 삽입
  INSERT INTO songs (
    artist_id,
    title,
    summary,
    vocabs
  ) VALUES (
    artist_id_var,
    'ray',
    '이별 후의 아픔과 그리움을 안고 살아가는 과정에서 희망을 찾아가는 과정을 그린 노래

🎭 분위기: 슬픔, 그리움, 희망, 위로

🔑 키워드: お別れ (이별), 痛み (아픔), 透明な彗星 (투명한 혜성), 思い出 (추억), 大丈夫だ (괜찮아)

📖 테마: 이별과 상실, 아픔과 치유, 추억과 그리움, 희망과 극복',
    '[
      {"name": "お別れ", "meaning": "헤어짐", "pronunciation": "owakare"},
      {"name": "悲しい", "meaning": "슬픈", "pronunciation": "kanashii"},
      {"name": "光", "meaning": "빛", "pronunciation": "hikari"},
      {"name": "封じ込める", "meaning": "잠그다", "pronunciation": "fujikomeru"},
      {"name": "踵", "meaning": "발 언저리", "pronunciation": "kakato"},
      {"name": "透明", "meaning": "투명한", "pronunciation": "tomenai"},
      {"name": "彗星", "meaning": "혜성", "pronunciation": "suisei"},
      {"name": "唄", "meaning": "노래", "pronunciation": "uta"},
      {"name": "寂しい", "meaning": "외로운", "pronunciation": "sabishii"},
      {"name": "正常", "meaning": "정상", "pronunciation": "seijou"},
      {"name": "異常", "meaning": "비정상", "pronunciation": "ijou"},
      {"name": "考える", "meaning": "생각하다", "pronunciation": "kangaeru"},
      {"name": "暇", "meaning": "시간", "pronunciation": "hima"},
      {"name": "大変", "meaning": "힘든", "pronunciation": "taiketsu"},
      {"name": "楽しい", "meaning": "즐거운", "pronunciation": "tanoshii"},
      {"name": "忘れる", "meaning": "잊다", "pronunciation": "wasureru"},
      {"name": "消える", "meaning": "사라지다", "pronunciation": "kiieru"},
      {"name": "理想", "meaning": "이상", "pronunciation": "risou"},
      {"name": "現実", "meaning": "현실", "pronunciation": "genjitsu"},
      {"name": "思い出", "meaning": "추억", "pronunciation": "omoide"},
      {"name": "軌跡", "meaning": "기적", "pronunciation": "kiseki"},
      {"name": "輝き", "meaning": "반짝임", "pronunciation": "kagayaki"},
      {"name": "何", "meaning": "무엇", "pronunciation": "nani"},
      {"name": "影", "meaning": "그림자", "pronunciation": "kage"},
      {"name": "伸ばす", "meaning": "뻗다", "pronunciation": "nobasu"},
      {"name": "時々", "meaning": "이따금", "pronunciation": "tokidoki"},
      {"name": "熱", "meaning": "열", "pronunciation": "netsu"},
      {"name": "時間", "meaning": "시간", "pronunciation": "jikan"},
      {"name": "眠る", "meaning": "잠들다", "pronunciation": "nemuru"},
      {"name": "夢", "meaning": "꿈", "pronunciation": "yume"},
      {"name": "解る", "meaning": "느끼다", "pronunciation": "wakaru"},
      {"name": "会う", "meaning": "만나다", "pronunciation": "au"},
      {"name": "晴天", "meaning": "청량한 하늘", "pronunciation": "seiten"},
      {"name": "終わる", "meaning": "끝나다", "pronunciation": "owaru"},
      {"name": "暗闇", "meaning": "어둠", "pronunciation": "kurayami"},
      {"name": "星", "meaning": "별", "pronunciation": "hoshi"},
      {"name": "思い浮かべる", "meaning": "떠올리다", "pronunciation": "omoide"},
      {"name": "銀河", "meaning": "은하", "pronunciation": "ginga"},
      {"name": "泣く", "meaning": "울다", "pronunciation": "naku"},
      {"name": "靴", "meaning": "신발", "pronunciation": "kutsu"},
      {"name": "新しく", "meaning": "새롭게", "pronunciation": "atarashiku"},
      {"name": "伝える", "meaning": "전하다", "pronunciation": "tsutaeru"},
      {"name": "恐らく", "meaning": "아마", "pronunciation": "osoraku"},
      {"name": "ありきたり", "meaning": "흔히 있는", "pronunciation": "arikitar"},
      {"name": "繋がる", "meaning": "맞잡아 이어지다", "pronunciation": "tsunagaru"},
      {"name": "確かめる", "meaning": "알아내다", "pronunciation": "tashikameru"},
      {"name": "生きる", "meaning": "살아가다", "pronunciation": "ikiru"},
      {"name": "始まり", "meaning": "시작지점", "pronunciation": "hajimari"}
    ]'::jsonb
  );
END $$;

-- 확인
SELECT
  s.title,
  a.name as artist_name,
  s.summary,
  jsonb_array_length(s.vocabs) as vocab_count
FROM songs s
JOIN artists a ON s.artist_id = a.id
WHERE s.title = 'ray';
