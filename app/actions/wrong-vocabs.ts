'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

// 틀린 단어 기록 (원자적 UPSERT)
export async function recordWrongVocab(
  songId: string,
  vocabName: string,
  vocabMeaning: string,
  vocabPronunciation: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  // @ts-ignore - Supabase type inference issue
  const { error } = await supabase.rpc('record_wrong_vocab', {
    p_user_id: user.id,
    p_song_id: songId,
    p_vocab_name: vocabName,
    p_vocab_meaning: vocabMeaning,
    p_vocab_pronunciation: vocabPronunciation,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/review')
  return { success: true }
}

// 틀린 단어 삭제
export async function deleteWrongVocab(wrongVocabId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const { error } = await supabase
    .from('wrong_vocabs')
    .delete()
    .eq('id', wrongVocabId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/review')
  return { success: true }
}
