'use client'

import { useState } from 'react'
import type { Vocab } from '@/types/database'

interface VocabCardProps {
  vocab: Vocab
  index: number
}

export default function VocabCard({ vocab, index }: VocabCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer p-6 relative group"
    >
      {/* 번호 뱃지 */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-sm font-medium">
        {index + 1}
      </div>

      {!isFlipped ? (
        // 앞면: 일본어 단어
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {vocab.name}
          </div>
          <div className="text-lg text-gray-500 dark:text-gray-400 mb-6">
            {vocab.pronunciation}
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            클릭하여 뜻 보기 →
          </div>
        </div>
      ) : (
        // 뒷면: 한국어 뜻
        <div className="text-center py-4">
          <div className="text-2xl text-gray-500 dark:text-gray-400 mb-2">
            {vocab.name}
          </div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            {vocab.meaning}
          </div>
          <div className="text-lg text-gray-500 dark:text-gray-400 mb-6">
            {vocab.pronunciation}
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            ← 다시 클릭
          </div>
        </div>
      )}

      {/* 플립 인디케이터 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <div className="flex gap-1">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              !isFlipped
                ? 'bg-indigo-600 dark:bg-indigo-400'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              isFlipped
                ? 'bg-indigo-600 dark:bg-indigo-400'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        </div>
      </div>
    </div>
  )
}
