'use server'

import { createClient } from '@/lib/supabase-server'

// 가수 검색
export async function searchArtists(query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(20)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// 노래 검색 (가수명 포함)
export async function searchSongs(query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('songs')
    .select(
      `
      *,
      artist:artists(id, name, image_url)
    `
    )
    .or(`title.ilike.%${query}%,artist.name.ilike.%${query}%`)
    .limit(20)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// 가수 상세 조회 (노래 목록 포함)
export async function getArtistWithSongs(artistId: string) {
  const supabase = await createClient()

  // 가수 정보
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('*')
    .eq('id', artistId)
    .single()

  if (artistError) {
    return { error: artistError.message, data: null }
  }

  // 가수의 노래 목록
  const { data: songs, error: songsError } = await supabase
    .from('songs')
    .select('*')
    .eq('artist_id', artistId)

  if (songsError) {
    return { error: songsError.message, data: null }
  }

  return { data: { artist, songs }, error: null }
}

// 노래 상세 조회 (vocabs 포함)
export async function getSongWithVocabs(songId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('songs')
    .select(
      `
      *,
      artist:artists(id, name, image_url),
      album:albums(id, title, cover_image_url)
    `
    )
    .eq('id', songId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// 전체 가수 목록
export async function getAllArtists() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('name')

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// 최근 추가된 노래
export async function getRecentSongs(limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('songs')
    .select(
      `
      *,
      artist:artists(id, name, image_url)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}
