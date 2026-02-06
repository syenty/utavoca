import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navigation from '@/app/components/Navigation'
import Link from 'next/link'
import FavoriteButton from '@/app/components/FavoriteButton'
import VocabCard from '@/app/components/VocabCard'
import type { Vocab } from '@/types/database'

interface SongPageProps {
  params: {
    id: string
  }
}

export default async function SongPage({ params }: SongPageProps) {
  const supabase = await createClient()

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 노래 정보 조회 (아티스트 정보 포함)
  const { data: song, error: songError } = await supabase
    .from('songs')
    .select(
      `
      *,
      artist:artists(id, name, name_en, name_ko, image_url)
    `
    )
    .eq('id', params.id)
    .single()

  if (songError || !song) {
    notFound()
  }

  // 즐겨찾기 여부 확인
  const { data: favorite } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('favoritable_type', 'song')
    .eq('favoritable_id', params.id)
    .single()

  const isFavorited = !!favorite

  const vocabs = (song.vocabs as Vocab[]) || []

  return (
    <>
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 노래 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* 노래 썸네일 */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                {song.title.charAt(0)}
              </div>
            </div>

            {/* 노래 정보 */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {song.title}
                </h1>

                {/* 아티스트 링크 */}
                <Link
                  href={`/artists/${song.artist.id}`}
                  className="inline-flex items-center gap-2 text-lg text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  <span>{song.artist.name}</span>
                  {song.artist.name_ko && (
                    <span className="text-gray-500 dark:text-gray-500">
                      ({song.artist.name_ko})
                    </span>
                  )}
                </Link>
              </div>

              {/* 요약 */}
              {song.summary && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {song.summary}
                  </p>
                </div>
              )}

              {/* 통계 & 액션 */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    📚 {vocabs.length}개의 단어
                  </span>
                </div>

                <FavoriteButton
                  type="song"
                  id={params.id}
                  initialIsFavorited={isFavorited}
                />

                {vocabs.length > 0 && (
                  <Link
                    href={`/test/${params.id}`}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <span>✏️</span>
                    <span>단어 테스트 시작</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 단어 목록 */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              학습 단어
            </h2>
            {vocabs.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                총 {vocabs.length}개
              </span>
            )}
          </div>

          {vocabs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {vocabs.map((vocab, index) => (
                <VocabCard key={index} vocab={vocab} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">📚</div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                아직 등록된 단어가 없습니다
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                관리자가 곧 단어를 추가할 예정입니다
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
