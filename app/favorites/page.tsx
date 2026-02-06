import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navigation from '@/app/components/Navigation'
import FavoritesList from '@/app/components/FavoritesList'

export default async function FavoritesPage() {
  const supabase = await createClient()

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 즐겨찾기한 아티스트 조회
  const { data: artistFavorites } = await supabase
    .from('favorites')
    .select(
      `
      id,
      created_at,
      favoritable_id,
      artist:artists(id, name, name_en, name_ko, image_url)
    `
    )
    .eq('user_id', user.id)
    .eq('favoritable_type', 'artist')
    .order('created_at', { ascending: false })

  // 즐겨찾기한 노래 조회
  const { data: songFavorites } = await supabase
    .from('favorites')
    .select(
      `
      id,
      created_at,
      favoritable_id,
      song:songs(
        id,
        title,
        summary,
        vocabs,
        artist:artists(id, name, name_ko)
      )
    `
    )
    .eq('user_id', user.id)
    .eq('favoritable_type', 'song')
    .order('created_at', { ascending: false })

  // 데이터 정리
  const artists = artistFavorites
    ?.map((fav) => ({
      favoriteId: fav.id,
      ...fav.artist,
    }))
    .filter((item) => item.id) || []

  const songs = songFavorites
    ?.map((fav) => ({
      favoriteId: fav.id,
      ...fav.song,
    }))
    .filter((item) => item.id) || []

  return (
    <>
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⭐ 즐겨찾기
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            좋아하는 아티스트와 노래를 모아보세요
          </p>
        </div>

        {/* 즐겨찾기 목록 (클라이언트 컴포넌트) */}
        <FavoritesList initialArtists={artists} initialSongs={songs} />
      </main>
    </>
  )
}
