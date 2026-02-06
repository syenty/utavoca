'use client'

import { useState, useEffect } from 'react'
import { useRouter, redirect } from 'next/navigation'
import Link from 'next/link'
import { searchArtists, searchSongs } from '@/app/actions/search'
import { createClient } from '@/lib/supabase'
import Navigation from '@/app/components/Navigation'
import type { Artist, Song } from '@/types/database'

type SearchResult = {
  artists: (Artist & { similarity_score?: number })[]
  songs: (Song & {
    similarity_score?: number
    artist_name?: string
    artist_name_en?: string | null
    artist_name_ko?: string | null
  })[]
}

export default function SearchPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({
    artists: [],
    songs: [],
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'artists' | 'songs'>('all')

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
      } else {
        setUserEmail(user.email)
      }
    }

    checkAuth()
  }, [router, supabase])

  // 디바운스된 검색
  useEffect(() => {
    if (!query.trim()) {
      setResults({ artists: [], songs: [] })
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)

      try {
        const [artistsResult, songsResult] = await Promise.all([
          searchArtists(query),
          searchSongs(query),
        ])

        setResults({
          artists: artistsResult.data || [],
          songs: songsResult.data || [],
        })
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms 디바운스

    return () => clearTimeout(timer)
  }, [query])

  const filteredArtists =
    activeTab === 'songs' ? [] : results.artists
  const filteredSongs =
    activeTab === 'artists' ? [] : results.songs

  const totalResults = results.artists.length + results.songs.length

  if (!userEmail) {
    return null // 로딩 중
  }

  return (
    <>
      <Navigation userEmail={userEmail} />

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* 검색 헤더 */}
        <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← 뒤로
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              검색
            </h1>
          </div>

          {/* 검색 입력 */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="아티스트나 노래를 검색하세요... (일본어, 영어, 한글 모두 가능)"
              className="w-full px-4 py-3 pl-12 pr-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>

          {/* 탭 */}
          {query && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                전체 ({totalResults})
              </button>
              <button
                onClick={() => setActiveTab('artists')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'artists'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                아티스트 ({results.artists.length})
              </button>
              <button
                onClick={() => setActiveTab('songs')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'songs'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                노래 ({results.songs.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!query ? (
          // 검색 전 상태
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              검색어를 입력하세요
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              일본어, 영어, 한글 모두 검색 가능합니다
            </p>
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-500 space-y-1">
              <p>예: "후지이", "Fujii", "藤井"</p>
              <p>예: "원오크록", "ONE OK ROCK"</p>
            </div>
          </div>
        ) : totalResults === 0 && !loading ? (
          // 검색 결과 없음
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              검색 결과가 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              "{query}"에 대한 결과를 찾을 수 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 아티스트 결과 */}
            {filteredArtists.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  아티스트 ({filteredArtists.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredArtists.map((artist) => (
                    <Link
                      key={artist.id}
                      href={`/artists/${artist.id}`}
                      className="group"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-4 text-center">
                        <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {artist.name.charAt(0)}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {artist.name}
                        </h3>
                        {artist.name_ko && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {artist.name_ko}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 노래 결과 */}
            {filteredSongs.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  노래 ({filteredSongs.length})
                </h2>
                <div className="grid gap-4">
                  {filteredSongs.map((song) => (
                    <Link
                      key={song.id}
                      href={`/songs/${song.id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                          {song.title.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {song.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {song.artist_name}
                            {song.artist_name_ko && ` (${song.artist_name_ko})`}
                          </p>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {Array.isArray(song.vocabs) ? song.vocabs.length : 0}개
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            단어
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      </div>
    </>
  )
}
