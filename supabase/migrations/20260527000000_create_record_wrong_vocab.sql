-- Atomic upsert for wrong_vocabs to eliminate read-modify-write race conditions.
-- Increments wrong_count and refreshes last_wrong_at when the row exists,
-- otherwise inserts a new row with wrong_count = 1.

CREATE OR REPLACE FUNCTION record_wrong_vocab(
  p_user_id UUID,
  p_song_id UUID,
  p_vocab_name TEXT,
  p_vocab_meaning TEXT,
  p_vocab_pronunciation TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO wrong_vocabs (
    user_id,
    song_id,
    vocab_name,
    vocab_meaning,
    vocab_pronunciation
  ) VALUES (
    p_user_id,
    p_song_id,
    p_vocab_name,
    p_vocab_meaning,
    p_vocab_pronunciation
  )
  ON CONFLICT (user_id, song_id, vocab_name)
  DO UPDATE SET
    wrong_count = wrong_vocabs.wrong_count + 1,
    last_wrong_at = NOW();
END;
$$;
