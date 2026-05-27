'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/app/components/Navigation'
import { recordWrongVocab } from '@/app/actions/wrong-vocabs'
import type { Vocab } from '@/types/database'

type TestMode = 'jp-to-kr' | 'kr-to-jp' | 'random'
type TestState = 'setup' | 'testing' | 'result'

interface ReviewVocab {
  id: string
  vocab: Vocab
  songId: string
  songTitle: string
  artistName: string
  songVocabs: Vocab[]
}

interface Question {
  reviewVocab: ReviewVocab
  mode: 'jp-to-kr' | 'kr-to-jp'
  choices: string[]
  correctAnswer: string
}

interface TestResult {
  question: Question
  userAnswer: string
  isCorrect: boolean
}

export default function ReviewTestPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState<string>()
  const [reviewVocabs, setReviewVocabs] = useState<ReviewVocab[]>([])
  const [loading, setLoading] = useState(true)
  const [testState, setTestState] = useState<TestState>('setup')

  const [mode, setMode] = useState<TestMode>('jp-to-kr')
  const [questionCount, setQuestionCount] = useState(10)

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [results, setResults] = useState<TestResult[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string>()

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email)

      const { data } = await supabase
        .from('wrong_vocabs')
        .select(
          `
          id,
          vocab_name,
          vocab_meaning,
          vocab_pronunciation,
          song_id,
          song:songs(
            id,
            title,
            vocabs,
            artist:artists(name)
          )
        `
        )
        .eq('user_id', user.id)
        .order('wrong_count', { ascending: false })

      const rows = (data as any[]) || []
      const mapped: ReviewVocab[] = rows
        .filter((r) => r.song)
        .map((r) => ({
          id: r.id,
          vocab: {
            name: r.vocab_name,
            meaning: r.vocab_meaning,
            pronunciation: r.vocab_pronunciation,
          },
          songId: r.song.id,
          songTitle: r.song.title,
          artistName: r.song.artist?.name ?? '',
          songVocabs: (r.song.vocabs as Vocab[]) || [],
        }))

      setReviewVocabs(mapped)
      setQuestionCount(Math.min(10, mapped.length))
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  const generateQuestions = () => {
    if (reviewVocabs.length === 0) return

    const shuffled = [...reviewVocabs].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(questionCount, reviewVocabs.length))

    const fallbackPool: Vocab[] = reviewVocabs.flatMap((r) => r.songVocabs)

    const generated: Question[] = selected.map((rv) => {
      const questionMode: 'jp-to-kr' | 'kr-to-jp' =
        mode === 'random' ? (Math.random() > 0.5 ? 'jp-to-kr' : 'kr-to-jp') : mode

      const correctAnswer =
        questionMode === 'jp-to-kr' ? rv.vocab.meaning : rv.vocab.name

      const otherInSong = rv.songVocabs.filter((v) => v.name !== rv.vocab.name)
      let distractorPool = otherInSong
      if (distractorPool.length < 3) {
        const extras = fallbackPool.filter(
          (v) =>
            v.name !== rv.vocab.name &&
            !distractorPool.some((d) => d.name === v.name)
        )
        distractorPool = [...distractorPool, ...extras]
      }

      const wrongAnswers = distractorPool
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((v) => (questionMode === 'jp-to-kr' ? v.meaning : v.name))

      const choices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)

      return {
        reviewVocab: rv,
        mode: questionMode,
        choices,
        correctAnswer,
      }
    })

    setQuestions(generated)
    setCurrentQuestionIndex(0)
    setResults([])
    setTestState('testing')
  }

  const handleAnswer = (answer: string) => {
    if (showFeedback) return

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correctAnswer

    setSelectedAnswer(answer)
    setShowFeedback(true)

    setResults([
      ...results,
      {
        question: currentQuestion,
        userAnswer: answer,
        isCorrect,
      },
    ])
  }

  const handleNext = () => {
    setShowFeedback(false)
    setSelectedAnswer(undefined)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setTestState('result')
      saveResults()
    }
  }

  const saveResults = async () => {
    const wrongAnswers = results.filter((r) => !r.isCorrect)
    for (const result of wrongAnswers) {
      try {
        await recordWrongVocab(
          result.question.reviewVocab.songId,
          result.question.reviewVocab.vocab.name,
          result.question.reviewVocab.vocab.meaning,
          result.question.reviewVocab.vocab.pronunciation
        )
      } catch (error) {
        console.error('Failed to save wrong vocab:', error)
      }
    }
  }

  const handleRestart = () => {
    setTestState('setup')
    setCurrentQuestionIndex(0)
    setResults([])
    setQuestions([])
    setShowFeedback(false)
    setSelectedAnswer(undefined)
  }

  if (loading || !userEmail) {
    return null
  }

  const currentQuestion = questions[currentQuestionIndex]
  const correctCount = results.filter((r) => r.isCorrect).length
  const totalCount = results.length
  const totalReviewVocabs = reviewVocabs.length

  const uniqueDistractorPoolSize = new Set(
    reviewVocabs.flatMap((r) => r.songVocabs.map((v) => v.name))
  ).size
  const canStartTest = totalReviewVocabs >= 1 && uniqueDistractorPoolSize >= 4

  const countOptions = Array.from(
    new Set([10, 20, totalReviewVocabs].filter((n) => n > 0 && n <= totalReviewVocabs))
  ).sort((a, b) => a - b)

  return (
    <>
      <Navigation userEmail={userEmail} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Setup State */}
        {testState === 'setup' && (
          <div>
            <div className="mb-8">
              <Link
                href="/review"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 inline-block"
              >
                ← 복습 노트로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                전체 복습 테스트
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                틀린 단어 {totalReviewVocabs}개로 테스트를 진행합니다
              </p>
            </div>

            {!canStartTest ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {totalReviewVocabs === 0
                    ? '복습할 단어가 없어요'
                    : '보기를 만들 단어가 부족해요'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {totalReviewVocabs === 0
                    ? '먼저 단어 테스트를 풀어 틀린 단어를 모아주세요'
                    : `보기 4개를 만들려면 단어 풀에 4개 이상이 필요합니다 (현재 ${uniqueDistractorPoolSize}개)`}
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  학습 시작하기
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-8">
                {/* Mode Selection */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    테스트 모드 선택
                  </h2>
                  <div className="grid gap-4">
                    <button
                      onClick={() => setMode('jp-to-kr')}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        mode === 'jp-to-kr'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        일본어 → 한글
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        일본어 단어를 보고 한글 뜻을 맞히기
                      </div>
                    </button>

                    <button
                      onClick={() => setMode('kr-to-jp')}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        mode === 'kr-to-jp'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        한글 → 일본어
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        한글 뜻을 보고 일본어 단어를 맞히기
                      </div>
                    </button>

                    <button
                      onClick={() => setMode('random')}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        mode === 'random'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        랜덤 (섞어서)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        두 가지 모드를 섞어서 출제
                      </div>
                    </button>
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    문제 개수
                  </h2>
                  <div className="flex gap-4">
                    {countOptions.map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                          questionCount === count
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        {count === totalReviewVocabs ? '전체' : `${count}개`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateQuestions}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-lg"
                >
                  테스트 시작하기 ✏️
                </button>
              </div>
            )}
          </div>
        )}

        {/* Testing State */}
        {testState === 'testing' && currentQuestion && (
          <div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {correctCount} / {totalCount} 정답
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
              <div className="text-center mb-8">
                <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  {currentQuestion.mode === 'jp-to-kr' ? '일본어 → 한글' : '한글 → 일본어'}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentQuestion.mode === 'jp-to-kr'
                    ? currentQuestion.reviewVocab.vocab.name
                    : currentQuestion.reviewVocab.vocab.meaning}
                </div>
                <div className="text-xl text-gray-500 dark:text-gray-400">
                  {currentQuestion.reviewVocab.vocab.pronunciation}
                </div>
                <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  📝 {currentQuestion.reviewVocab.songTitle}
                  {currentQuestion.reviewVocab.artistName && (
                    <span> · {currentQuestion.reviewVocab.artistName}</span>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {currentQuestion.choices.map((choice, index) => {
                  const isSelected = selectedAnswer === choice
                  const isCorrect = choice === currentQuestion.correctAnswer
                  const showResult = showFeedback && isSelected

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(choice)}
                      disabled={showFeedback}
                      className={`p-4 rounded-lg border-2 text-left font-medium transition-all ${
                        showResult
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : showFeedback && isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-700 disabled:cursor-not-allowed'
                      }`}
                    >
                      <span className="text-gray-500 dark:text-gray-500 mr-3">
                        {['①', '②', '③', '④'][index]}
                      </span>
                      {choice}
                      {showResult && (
                        <span className="float-right text-xl">
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      )}
                      {showFeedback && !isSelected && isCorrect && (
                        <span className="float-right text-xl">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {showFeedback && (
                <button
                  onClick={handleNext}
                  className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {currentQuestionIndex < questions.length - 1
                    ? '다음 문제 →'
                    : '결과 보기'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result State */}
        {testState === 'result' && (
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 text-center">
              <div className="text-6xl mb-4">
                {correctCount === totalCount
                  ? '🎉'
                  : correctCount >= totalCount * 0.7
                  ? '😊'
                  : '😅'}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                테스트 완료!
              </h2>
              <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 my-6">
                {correctCount} / {totalCount}
              </div>
              <div className="text-xl text-gray-600 dark:text-gray-400">
                정답률: {Math.round((correctCount / totalCount) * 100)}%
              </div>
            </div>

            {results.filter((r) => !r.isCorrect).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  틀린 문제 ({results.filter((r) => !r.isCorrect).length}개)
                </h3>
                <div className="space-y-4">
                  {results
                    .filter((r) => !r.isCorrect)
                    .map((result, index) => (
                      <div
                        key={index}
                        className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {result.question.reviewVocab.vocab.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {result.question.reviewVocab.vocab.pronunciation}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-red-600 dark:text-red-400">
                              선택: {result.userAnswer}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">
                              정답: {result.question.correctAnswer}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={handleRestart}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                다시 테스트
              </button>
              <Link
                href="/review"
                className="py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors text-center"
              >
                📝 복습 노트 보기
              </Link>
              <Link
                href="/"
                className="py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors text-center"
              >
                홈으로
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
