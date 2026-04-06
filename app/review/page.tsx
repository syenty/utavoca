import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navigation from '@/app/components/Navigation'
import ReviewList from '@/app/components/ReviewList'

export default async function ReviewPage() {
  const supabase = await createClient()

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 틀린 단어 목록 조회 (wrong_count 높은 순)
  // @ts-ignore - Supabase type inference issue
  const { data: wrongVocabs } = await supabase
    .from('wrong_vocabs')
    .select(
      `
      *,
      song:songs(
        id,
        title,
        artist:artists(name, name_ko)
      )
    `
    )
    .eq('user_id', user.id)
    .order('wrong_count', { ascending: false })
    .order('last_wrong_at', { ascending: false })

  // Type assertion to work around Supabase type inference issues
  const vocabs = (wrongVocabs as any) || []

  return (
    <>
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📝 복습 노트
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            틀린 단어들을 복습하고 완벽하게 익혀보세요
          </p>
        </div>

        {/* 통계 카드 */}
        {vocabs.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                총 틀린 단어
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {vocabs.length}개
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                가장 많이 틀린 단어
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {vocabs[0]?.vocab_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {vocabs[0]?.wrong_count}번 틀림
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                평균 오답 횟수
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {(
                  vocabs.reduce((sum: number, v: any) => sum + v.wrong_count, 0) /
                  vocabs.length
                ).toFixed(1)}
                회
              </div>
            </div>
          </div>
        )}

        {/* 복습 단어 목록 */}
        <ReviewList initialVocabs={vocabs} />
      </main>
    </>
  )
}
