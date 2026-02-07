'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

// 틀린 단어 기록 (UPSERT)
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

  // 이미 있으면 wrong_count 증가
  // @ts-ignore - Supabase type inference issue
  const { data: existing } = await supabase
    .from('wrong_vocabs')
    .select('*')
    .eq('user_id', user.id)
    .eq('song_id', songId)
    .eq('vocab_name', vocabName)
    .single()

  if (existing) {
    // UPDATE
    const { error } = await supabase
      .from('wrong_vocabs')
      // @ts-ignore - Supabase type inference issue
      .update({
        // @ts-ignore
        wrong_count: existing.wrong_count + 1,
        last_wrong_at: new Date().toISOString(),
      })
      // @ts-ignore
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // INSERT
    // @ts-ignore - Supabase type inference issue
    const { error } = await supabase.from('wrong_vocabs').insert({
      user_id: user.id,
      song_id: songId,
      vocab_name: vocabName,
      vocab_meaning: vocabMeaning,
      vocab_pronunciation: vocabPronunciation,
    })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/')
  return { success: true }
}

// 복습할 단어 조회 (함수 사용)
export async function getWrongVocabsForReview(limit: number = 10) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.', data: null }
  }

  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase.rpc('get_wrong_vocabs_for_review', {
    p_user_id: user.id,
    p_limit: limit,
  })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// 틀린 단어 목록 조회
export async function getWrongVocabs() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.', data: null }
  }

  const { data, error } = await supabase
    .from('wrong_vocabs')
    .select(
      `
      *,
      song:songs(
        id,
        title,
        artist:artists(name)
      )
    `
    )
    .eq('user_id', user.id)
    .order('wrong_count', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
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

  revalidatePath('/')
  return { success: true }
}
