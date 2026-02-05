import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { signOut } from './actions/auth'

export default async function Home() {
  const supabase = await createClient()

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 테스트: artists 데이터 조회
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Utavoca
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            환영합니다! 🎵
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            일본 노래 가사로 일본어를 배워보세요.
          </p>
        </div>

        {/* 가수 목록 (테스트) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            가수 목록
          </h3>
          {artists && artists.length > 0 ? (
            <ul className="space-y-2">
              {artists.map((artist) => (
                <li
                  key={artist.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-gray-900 dark:text-white font-medium">
                    {artist.name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              아직 등록된 가수가 없습니다. 관리자에게 문의하세요.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
