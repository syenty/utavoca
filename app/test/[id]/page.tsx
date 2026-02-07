'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/app/components/Navigation'
import { recordWrongVocab } from '@/app/actions/wrong-vocabs'
import type { Song, Vocab } from '@/types/database'

type TestMode = 'jp-to-kr' | 'kr-to-jp' | 'random'
type TestState = 'setup' | 'testing' | 'result'

interface Question {
  vocab: Vocab
  mode: 'jp-to-kr' | 'kr-to-jp'
  choices: string[]
  correctAnswer: string
}

interface TestResult {
  question: Question
  userAnswer: string
  isCorrect: boolean
}

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [songId, setSongId] = useState<string>()
  const [userEmail, setUserEmail] = useState<string>()
  const [song, setSong] = useState<Song & { artist?: { name: string; name_ko: string | null } }>()
  const [testState, setTestState] = useState<TestState>('setup')

  // Setup state
  const [mode, setMode] = useState<TestMode>('jp-to-kr')
  const [questionCount, setQuestionCount] = useState(10)

  // Testing state
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [results, setResults] = useState<TestResult[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string>()

  // Unwrap params
  useEffect(() => {
    params.then(({ id }) => setSongId(id))
  }, [params])

  // Load user and song
  useEffect(() => {
    if (!songId) return

    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email)

      const { data: songData } = await supabase
        .from('songs')
        .select('*, artist:artists(name, name_ko)')
        .eq('id', songId)
        .single()

      if (songData) {
        setSong(songData as any)
      }
    }

    loadData()
  }, [songId, router, supabase])

  // Generate questions
  const generateQuestions = () => {
    if (!song || !song.vocabs || song.vocabs.length === 0) return

    const vocabs = song.vocabs as Vocab[]
    const availableVocabs = [...vocabs]

    // Shuffle and select questions
    const shuffled = availableVocabs.sort(() => Math.random() - 0.5)
    const selectedVocabs = shuffled.slice(0, Math.min(questionCount, vocabs.length))

    const generatedQuestions: Question[] = selectedVocabs.map((vocab) => {
      // Determine mode for this question
      let questionMode: 'jp-to-kr' | 'kr-to-jp'
      if (mode === 'random') {
        questionMode = Math.random() > 0.5 ? 'jp-to-kr' : 'kr-to-jp'
      } else {
        questionMode = mode
      }

      // Generate choices (1 correct + 3 wrong)
      const correctAnswer = questionMode === 'jp-to-kr' ? vocab.meaning : vocab.name

      // Get wrong answers from other vocabs
      const otherVocabs = vocabs.filter((v) => v.name !== vocab.name)
      const wrongAnswers = otherVocabs
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((v) => questionMode === 'jp-to-kr' ? v.meaning : v.name)

      // Combine and shuffle
      const choices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)

      return {
        vocab,
        mode: questionMode,
        choices,
        correctAnswer,
      }
    })

    setQuestions(generatedQuestions)
    setCurrentQuestionIndex(0)
    setResults([])
    setTestState('testing')
  }

  // Handle answer selection
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

  // Next question
  const handleNext = () => {
    setShowFeedback(false)
    setSelectedAnswer(undefined)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Test finished
      setTestState('result')
      saveResults()
    }
  }

  // Save wrong answers to database
  const saveResults = async () => {
    if (!song) return

    const wrongAnswers = results.filter((r) => !r.isCorrect)

    // Save each wrong answer to wrong_vocabs table
    for (const result of wrongAnswers) {
      try {
        await recordWrongVocab(
          songId!,
          result.question.vocab.name,
          result.question.vocab.meaning,
          result.question.vocab.pronunciation
        )
      } catch (error) {
        console.error('Failed to save wrong vocab:', error)
      }
    }

    console.log(`✅ Saved ${wrongAnswers.length} wrong answers to database`)
  }

  // Restart test
  const handleRestart = () => {
    setTestState('setup')
    setCurrentQuestionIndex(0)
    setResults([])
    setQuestions([])
    setShowFeedback(false)
    setSelectedAnswer(undefined)
  }

  if (!userEmail || !song) {
    return null
  }

  const currentQuestion = questions[currentQuestionIndex]
  const correctCount = results.filter((r) => r.isCorrect).length
  const totalCount = results.length

  return (
    <>
      <Navigation userEmail={userEmail} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Setup State */}
        {testState === 'setup' && (
          <div>
            <div className="mb-8">
              <Link
                href={`/songs/${songId!}`}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 inline-block"
              >
                ← 노래로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                단어 테스트
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {song.title} - {song.artist?.name}
              </p>
            </div>

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
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                      예: 光 (hikari) → <span className="font-medium">빛</span>
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
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                      예: 빛 (hikari) → <span className="font-medium">光</span>
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
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                      더 도전적인 테스트! 🔥
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
                  {[10, 20, (song.vocabs as Vocab[]).length].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                        questionCount === count
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      {count === (song.vocabs as Vocab[]).length ? '전체' : `${count}개`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={generateQuestions}
                disabled={(song.vocabs as Vocab[]).length < 4}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-lg"
              >
                {(song.vocabs as Vocab[]).length < 4
                  ? '단어가 4개 이상 필요합니다'
                  : '테스트 시작하기 ✏️'}
              </button>
            </div>
          </div>
        )}

        {/* Testing State */}
        {testState === 'testing' && currentQuestion && (
          <div>
            {/* Progress */}
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

            {/* Question */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
              <div className="text-center mb-8">
                <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  {currentQuestion.mode === 'jp-to-kr' ? '일본어 → 한글' : '한글 → 일본어'}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentQuestion.mode === 'jp-to-kr'
                    ? currentQuestion.vocab.name
                    : currentQuestion.vocab.meaning}
                </div>
                <div className="text-xl text-gray-500 dark:text-gray-400">
                  {currentQuestion.vocab.pronunciation}
                </div>
              </div>

              {/* Choices */}
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

              {/* Next Button */}
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
                {correctCount === totalCount ? '🎉' : correctCount >= totalCount * 0.7 ? '😊' : '😅'}
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

            {/* Wrong Answers */}
            {results.filter((r) => !r.isCorrect).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    틀린 문제 ({results.filter((r) => !r.isCorrect).length}개)
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <span>✓</span>
                    <span>복습 노트에 저장됨</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {results
                    .filter((r) => !r.isCorrect)
                    .map((result, index) => (
                      <div
                        key={index}
                        className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {result.question.vocab.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {result.question.vocab.pronunciation}
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

            {/* Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={handleRestart}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                다시 테스트
              </button>
              {results.filter((r) => !r.isCorrect).length > 0 && (
                <Link
                  href="/review"
                  className="py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors text-center"
                >
                  📝 복습 노트 보기
                </Link>
              )}
              <Link
                href={`/songs/${songId!}`}
                className="py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors text-center"
              >
                노래로 돌아가기
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
