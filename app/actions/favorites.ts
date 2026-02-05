'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

// 즐겨찾기 추가
export async function addFavorite(
  favoritableType: 'artist' | 'song',
  favoritableId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const { error } = await supabase.from('favorites').insert({
    user_id: user.id,
    favoritable_type: favoritableType,
    favoritable_id: favoritableId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

// 즐겨찾기 삭제
export async function removeFavorite(favoriteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('id', favoriteId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

// 즐겨찾기 목록 조회
export async function getFavorites() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.', data: null }
  }

  const { data, error } = await supabase
    .from('favorites')
    .select(
      `
      *,
      artist:artists(id, name, image_url),
      song:songs(id, title, artist:artists(name))
    `
    )
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// 즐겨찾기된 가수/노래의 모든 vocabs 조회 (함수 사용)
export async function getFavoriteVocabs() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.', data: null }
  }

  const { data, error } = await supabase.rpc('get_favorite_vocabs', {
    p_user_id: user.id,
  })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}
