'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

// 즐겨찾기 추가 (멱등: 이미 있으면 무시)
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

  // @ts-ignore - Supabase type inference issue
  const { error } = await supabase.from('favorites').upsert(
    {
      user_id: user.id,
      favoritable_type: favoritableType,
      favoritable_id: favoritableId,
    },
    {
      onConflict: 'user_id,favoritable_type,favoritable_id',
      ignoreDuplicates: true,
    }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/favorites')
  return { success: true }
}

// 즐겨찾기 삭제 (type과 id로 삭제)
export async function removeFavorite(
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

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('favoritable_type', favoritableType)
    .eq('favoritable_id', favoritableId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/favorites')
  return { success: true }
}

