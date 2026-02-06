import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          노래를 찾을 수 없습니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          요청하신 노래가 존재하지 않거나 삭제되었습니다
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
