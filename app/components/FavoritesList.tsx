'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { removeFavorite } from '@/app/actions/favorites'
import type { Artist, Song, Vocab } from '@/types/database'

interface FavoritesListProps {
  initialArtists: (Artist & { favoriteId: string })[]
  initialSongs: (Song & {
    favoriteId: string
    artist?: { id: string; name: string; name_ko: string | null }
  })[]
}

export default function FavoritesList({
  initialArtists,
  initialSongs,
}: FavoritesListProps) {
  const [artists, setArtists] = useState(initialArtists)
  const [songs, setSongs] = useState(initialSongs)
  const [activeTab, setActiveTab] = useState<'artists' | 'songs'>('artists')
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemoveArtist = (artistId: string) => {
    setRemovingId(artistId)
    startTransition(async () => {
      const result = await removeFavorite('artist', artistId)
      if (!result.error) {
        setArtists((prev) => prev.filter((a) => a.id !== artistId))
      }
      setRemovingId(null)
    })
  }

  const handleRemoveSong = (songId: string) => {
    setRemovingId(songId)
    startTransition(async () => {
      const result = await removeFavorite('song', songId)
      if (!result.error) {
        setSongs((prev) => prev.filter((s) => s.id !== songId))
      }
      setRemovingId(null)
    })
  }

  const totalCount = artists.length + songs.length

  return (
    <>
      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('artists')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'artists'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          아티스트 ({artists.length})
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'songs'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          노래 ({songs.length})
        </button>
      </div>

      {/* 빈 상태 */}
      {totalCount === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            아직 즐겨찾기가 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            좋아하는 아티스트나 노래를 즐겨찾기에 추가해보세요
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            아티스트 둘러보기
          </Link>
        </div>
      ) : (
        <>
          {/* 아티스트 탭 */}
          {activeTab === 'artists' && (
            <div>
              {artists.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                  <div className="text-gray-400 text-5xl mb-4">🎤</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    즐겨찾기한 아티스트가 없습니다
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {artists.map((artist) => (
                    <div key={artist.id} className="group relative">
                      <Link href={`/artists/${artist.id}`}>
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

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleRemoveArtist(artist.id)}
                        disabled={isPending && removingId === artist.id}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="즐겨찾기 해제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 노래 탭 */}
          {activeTab === 'songs' && (
            <div>
              {songs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                  <div className="text-gray-400 text-5xl mb-4">🎵</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    즐겨찾기한 노래가 없습니다
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 relative group"
                    >
                      <Link href={`/songs/${song.id}`} className="block">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                            {song.title.charAt(0)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {song.title}
                            </h3>
                            {song.artist && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {song.artist.name}
                                {song.artist.name_ko &&
                                  ` (${song.artist.name_ko})`}
                              </p>
                            )}
                          </div>

                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {Array.isArray(song.vocabs)
                                ? song.vocabs.length
                                : 0}
                              개
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

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleRemoveSong(song.id)}
                        disabled={isPending && removingId === song.id}
                        className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="즐겨찾기 해제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
