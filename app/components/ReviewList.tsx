'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteWrongVocab } from '@/app/actions/wrong-vocabs'
import type { WrongVocab } from '@/types/database'

interface ReviewListProps {
  initialVocabs: (WrongVocab & {
    song?: {
      id: string
      title: string
      artist?: { name: string; name_ko: string | null }
    }
  })[]
}

export default function ReviewList({ initialVocabs }: ReviewListProps) {
  const [vocabs, setVocabs] = useState(initialVocabs)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteWrongVocab(id)
      if (result.error) {
        alert(`삭제에 실패했습니다: ${result.error}`)
      } else {
        setVocabs((prev) => prev.filter((v) => v.id !== id))
      }
      setDeletingId(null)
    })
  }

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (vocabs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          완벽해요!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          아직 틀린 단어가 없습니다. 계속 학습해보세요!
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          학습 시작하기
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          복습할 단어 ({vocabs.length}개)
        </h2>
        <Link
          href="/review/test"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          전체 복습 테스트
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vocabs.map((vocab) => (
          <div
            key={vocab.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow relative group"
          >
            {/* 삭제 버튼 */}
            <button
              onClick={() => handleDelete(vocab.id)}
              disabled={isPending && deletingId === vocab.id}
              className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
              title="복습 노트에서 제거"
            >
              ×
            </button>

            {/* 오답 횟수 뱃지 */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
              {vocab.wrong_count}번 틀림
            </div>

            {/* 단어 카드 */}
            <div
              onClick={() => toggleFlip(vocab.id)}
              className="p-6 pt-12 cursor-pointer"
            >
              {!flippedCards.has(vocab.id) ? (
                // 앞면: 일본어
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {vocab.vocab_name}
                  </div>
                  <div className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                    {vocab.vocab_pronunciation}
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    클릭하여 뜻 보기 →
                  </div>
                </div>
              ) : (
                // 뒷면: 한국어
                <div className="text-center py-4">
                  <div className="text-xl text-gray-500 dark:text-gray-400 mb-2">
                    {vocab.vocab_name}
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">
                    {vocab.vocab_meaning}
                  </div>
                  <div className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                    {vocab.vocab_pronunciation}
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    ← 다시 클릭
                  </div>
                </div>
              )}

              {/* 노래 정보 */}
              {vocab.song && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/songs/${vocab.song.id}`}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📝 {vocab.song.title}
                    {vocab.song.artist && (
                      <span className="text-gray-500 dark:text-gray-500 ml-1">
                        - {vocab.song.artist.name}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* 마지막 틀린 시간 */}
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                마지막: {new Date(vocab.last_wrong_at).toLocaleDateString()}
              </div>
            </div>

            {/* 플립 인디케이터 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className="flex gap-1">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    !flippedCards.has(vocab.id)
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    flippedCards.has(vocab.id)
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
