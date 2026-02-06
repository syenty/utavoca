'use client'

import { useState, useTransition } from 'react'
import { addFavorite, removeFavorite } from '@/app/actions/favorites'

interface FavoriteButtonProps {
  type: 'artist' | 'song'
  id: string
  initialIsFavorited: boolean
}

export default function FavoriteButton({
  type,
  id,
  initialIsFavorited,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isPending, startTransition] = useTransition()

  const handleToggle = async () => {
    startTransition(async () => {
      if (isFavorited) {
        // 즐겨찾기 해제
        const result = await removeFavorite(type, id)
        if (!result.error) {
          setIsFavorited(false)
        }
      } else {
        // 즐겨찾기 추가
        const result = await addFavorite(type, id)
        if (!result.error) {
          setIsFavorited(true)
        }
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isFavorited
          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="text-xl">{isFavorited ? '⭐' : '☆'}</span>
      <span className="text-sm">
        {isPending
          ? '처리 중...'
          : isFavorited
          ? '즐겨찾기 해제'
          : '즐겨찾기 추가'}
      </span>
    </button>
  )
}
