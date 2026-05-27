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

  // favorites 테이블은 polymorphic (favoritable_id에 FK 없음)이라
  // PostgREST 임베디드 조인 불가 → 2단계 fetch 후 메모리 join
  // @ts-ignore - Supabase type inference issue
  const { data: favoritesData } = await supabase
    .from('favorites')
    .select('id, favoritable_id, favoritable_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const favorites = (favoritesData as any[]) || []

  const artistFavorites = favorites.filter(
    (f) => f.favoritable_type === 'artist'
  )
  const songFavorites = favorites.filter((f) => f.favoritable_type === 'song')

  const artistIds = artistFavorites.map((f) => f.favoritable_id)
  const songIds = songFavorites.map((f) => f.favoritable_id)

  const [artistsRes, songsRes] = await Promise.all([
    artistIds.length > 0
      ? supabase
          .from('artists')
          .select('id, name, name_en, name_ko, image_url')
          .in('id', artistIds)
      : Promise.resolve({ data: [] as any[] }),
    songIds.length > 0
      ? supabase
          .from('songs')
          .select(
            `
            id,
            title,
            summary,
            vocabs,
            artist:artists(id, name, name_ko)
          `
          )
          .in('id', songIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const artistsById = new Map<string, any>(
    ((artistsRes.data as any[]) || []).map((a) => [a.id, a])
  )
  const songsById = new Map<string, any>(
    ((songsRes.data as any[]) || []).map((s) => [s.id, s])
  )

  // favorites 순서를 유지하면서 join, 누락된 entity는 제외
  const artists = artistFavorites
    .map((f) => {
      const artist = artistsById.get(f.favoritable_id)
      return artist ? { favoriteId: f.id, ...artist } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const songs = songFavorites
    .map((f) => {
      const song = songsById.get(f.favoritable_id)
      return song ? { favoriteId: f.id, ...song } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

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
