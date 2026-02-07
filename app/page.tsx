import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navigation from './components/Navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  // 로그인 선택사항 (로그인 안 해도 콘텐츠 볼 수 있음)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 전체 아티스트 조회 (복합 정렬: 즐겨찾기 수 DESC → 등록일 ASC → 노래 수 DESC → 이름 ASC)
  // @ts-ignore - Supabase type inference issue
  const { data: artists, error } = await supabase.rpc('get_artists_sorted', {
    p_limit: 12,
  })

  // RPC 함수 에러 시 기본 쿼리로 fallback
  let displayArtists: any = artists
  if (error || !artists) {
    console.error('RPC function error, falling back to default query:', error)
    // @ts-ignore - Supabase type inference issue
    const { data: fallbackArtists } = await supabase
      .from('artists')
      .select('*')
      .order('name')
      .limit(12)
    displayArtists = fallbackArtists
  }

  return (
    <>
      <Navigation userEmail={user?.email} />

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            환영합니다! 🎵
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            일본 노래 가사로 일본어를 배워보세요
          </p>
        </div>

        {/* 아티스트 그리드 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              아티스트
            </h2>
            <Link
              href="/search"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
            >
              전체 보기 →
            </Link>
          </div>

          {displayArtists && displayArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {displayArtists.map((artist: any) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-4 text-center">
                    {/* 아티스트 이미지 플레이스홀더 */}
                    <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {artist.name.charAt(0)}
                    </div>

                    {/* 아티스트 이름 */}
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {artist.name}
                    </h3>

                    {/* 영어/한글 이름 */}
                    {artist.name_ko && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {artist.name_ko}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                아직 등록된 아티스트가 없습니다
              </p>
            </div>
          )}
        </div>

        {/* 빠른 시작 카드 */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/search"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              검색하기
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              아티스트와 노래를 검색해보세요
            </p>
          </Link>

          <Link
            href="/favorites"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              즐겨찾기
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              좋아하는 아티스트와 노래 모음
            </p>
          </Link>

          <Link
            href="/review"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              복습하기
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              틀린 단어를 다시 공부해보세요
            </p>
          </Link>
        </div>
      </main>
    </>
  )
}
