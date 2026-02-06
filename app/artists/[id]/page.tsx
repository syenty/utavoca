import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navigation from '@/app/components/Navigation'
import Link from 'next/link'
import FavoriteButton from '@/app/components/FavoriteButton'

interface ArtistPageProps {
  params: {
    id: string
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const supabase = await createClient()

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 아티스트 정보 조회
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (artistError || !artist) {
    notFound()
  }

  // 아티스트의 노래 목록 조회
  const { data: songs } = await supabase
    .from('songs')
    .select('*')
    .eq('artist_id', params.id)
    .order('title')

  // 즐겨찾기 여부 확인
  const { data: favorite } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('favoritable_type', 'artist')
    .eq('favoritable_id', params.id)
    .single()

  const isFavorited = !!favorite

  return (
    <>
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 아티스트 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* 아티스트 아바타 */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                {artist.name.charAt(0)}
              </div>
            </div>

            {/* 아티스트 정보 */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {artist.name}
              </h1>
              {artist.name_en && artist.name_en !== artist.name && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                  {artist.name_en}
                </p>
              )}
              {artist.name_ko && (
                <p className="text-lg text-gray-500 dark:text-gray-500 mb-4">
                  {artist.name_ko}
                </p>
              )}

              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {songs?.length || 0}곡
                </div>
                <FavoriteButton
                  type="artist"
                  id={params.id}
                  initialIsFavorited={isFavorited}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 노래 목록 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            노래 목록
          </h2>

          {songs && songs.length > 0 ? (
            <div className="grid gap-4">
              {songs.map((song, index) => (
                <Link
                  key={song.id}
                  href={`/songs/${song.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
                >
                  <div className="flex items-center gap-4">
                    {/* 번호 */}
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium text-sm">
                      {index + 1}
                    </div>

                    {/* 노래 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {song.title}
                      </h3>
                      {song.summary && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {song.summary}
                        </p>
                      )}
                    </div>

                    {/* 단어 수 */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {Array.isArray(song.vocabs) ? song.vocabs.length : 0}개
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        단어
                      </div>
                    </div>

                    {/* 화살표 */}
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">🎵</div>
              <p className="text-gray-500 dark:text-gray-400">
                아직 등록된 노래가 없습니다
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
