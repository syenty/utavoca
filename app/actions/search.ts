'use server'

import { createClient } from '@/lib/supabase-server'

// 가수 검색 (일본어, 영어, 한글 모두 검색 - Trigram 유사도 검색)
export async function searchArtists(query: string) {
  const supabase = await createClient()

  // Use fuzzy search function with pg_trgm
  // Handles typos, spacing differences, and partial matches
  // Example: "원오크록" matches "원 오크 록"
  const { data, error } = await supabase.rpc('search_artists_fuzzy', {
    search_query: query,
  })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// 노래 검색 (가수명 포함 - 일본어, 영어, 한글 - Trigram 유사도 검색)
export async function searchSongs(query: string) {
  const supabase = await createClient()

  // Use fuzzy search function with pg_trgm
  // Searches in song title and artist names with fuzzy matching
  const { data, error } = await supabase.rpc('search_songs_fuzzy', {
    search_query: query,
  })

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
      artist:artists(id, name, name_en, name_ko, image_url),
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
      artist:artists(id, name, name_en, name_ko, image_url)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}
