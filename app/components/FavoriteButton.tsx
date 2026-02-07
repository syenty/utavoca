'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addFavorite, removeFavorite } from '@/app/actions/favorites'
import { createClient } from '@/lib/supabase'

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
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isPending, startTransition] = useTransition()
  const [isLoggedIn, setIsLoggedIn] = useState(true) // 기본값 true로 깜빡임 방지

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()
  }, [])

  const handleToggle = async () => {
    // 로그인하지 않은 경우 로그인 페이지로
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

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
