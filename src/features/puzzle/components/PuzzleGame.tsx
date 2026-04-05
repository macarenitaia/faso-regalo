'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// ─── Puzzle constants ─────────────────────────────────────────────────────────

const COLS = 3
const ROWS = 4
const TOTAL = COLS * ROWS
const TILE_COUNT = TOTAL - 1
const TILE_W = 110
const TILE_H = 110
const IMAGE_URL = '/barco-faso.png'

type Board = number[]

function getNeighbors(idx: number): number[] {
  const col = idx % COLS
  const row = Math.floor(idx / COLS)
  const result: number[] = []
  if (col > 0) result.push(idx - 1)
  if (col < COLS - 1) result.push(idx + 1)
  if (row > 0) result.push(idx - COLS)
  if (row < ROWS - 1) result.push(idx + COLS)
  return result
}

function createShuffled(steps = 400): Board {
  const board: Board = [...Array(TILE_COUNT).keys(), -1]
  let emptyIdx = TOTAL - 1
  let lastIdx = -1
  for (let i = 0; i < steps; i++) {
    const ns = getNeighbors(emptyIdx).filter(n => n !== lastIdx)
    const next = ns[Math.floor(Math.random() * ns.length)]
    ;[board[emptyIdx], board[next]] = [board[next], board[emptyIdx]]
    lastIdx = emptyIdx
    emptyIdx = next
  }
  return board
}

function checkSolved(board: Board): boolean {
  return board.every((t, i) => (i === TOTAL - 1 ? t === -1 : t === i))
}

// ─── Trivia data ──────────────────────────────────────────────────────────────

interface Question {
  category: string
  emoji: string
  question: string
  options: string[]
  correct: number
}

const QUESTION_POOLS: Question[][] = [
  // EGIPTO
  [
    {
      category: 'Egipto', emoji: '🏺',
      question: '¿Cuántos años aproximadamente gobernó Ramsés II, el Gran Faraón?',
      options: ['33 años', '67 años', '45 años', '21 años'],
      correct: 1,
    },
    {
      category: 'Egipto', emoji: '🏺',
      question: '¿Cómo se llama la escritura pictográfica de los antiguos egipcios?',
      options: ['Cuneiforme', 'Braille', 'Jeroglíficos', 'Alfabeto rúnico'],
      correct: 2,
    },
    {
      category: 'Egipto', emoji: '🏺',
      question: '¿Qué río era el corazón de la civilización del Antiguo Egipto?',
      options: ['El Éufrates', 'El Tigris', 'El Amazonas', 'El Nilo'],
      correct: 3,
    },
    {
      category: 'Egipto', emoji: '🏺',
      question: '¿Qué estructura funeraria construyeron los faraones del Antiguo Egipto?',
      options: ['Zigurats', 'Pirámides', 'Estupas', 'Coliseos'],
      correct: 1,
    },
  ],
  // MATEMÁTICAS
  [
    {
      category: 'Matemáticas', emoji: '🔢',
      question: '¿Cuánto es la raíz cuadrada de 144?',
      options: ['14', '13', '12', '11'],
      correct: 2,
    },
    {
      category: 'Matemáticas', emoji: '🔢',
      question: '¿Cuántos lados tiene un hexágono?',
      options: ['5', '7', '8', '6'],
      correct: 3,
    },
    {
      category: 'Matemáticas', emoji: '🔢',
      question: '¿Cuánto es 7 × 8?',
      options: ['54', '56', '48', '64'],
      correct: 1,
    },
    {
      category: 'Matemáticas', emoji: '🔢',
      question: '¿Cuál es el número primo más pequeño mayor que 10?',
      options: ['13', '11', '12', '15'],
      correct: 1,
    },
  ],
  // CULTURA GENERAL
  [
    {
      category: 'Cultura General', emoji: '🌟',
      question: '¿Cuántas cuerdas tiene una guitarra estándar?',
      options: ['4', '8', '5', '6'],
      correct: 3,
    },
    {
      category: 'Cultura General', emoji: '🌟',
      question: '¿Quién pintó la Mona Lisa?',
      options: ['Miguel Ángel', 'Botticelli', 'Leonardo da Vinci', 'Rafael'],
      correct: 2,
    },
    {
      category: 'Cultura General', emoji: '🌟',
      question: '¿Cuál es el planeta más grande del sistema solar?',
      options: ['Saturno', 'Júpiter', 'Urano', 'Neptuno'],
      correct: 1,
    },
    {
      category: 'Cultura General', emoji: '🌟',
      question: '¿De qué país es originaria la pizza?',
      options: ['España', 'Francia', 'Grecia', 'Italia'],
      correct: 3,
    },
  ],
  // GEOGRAFÍA
  [
    {
      category: 'Geografía', emoji: '🗺️',
      question: '¿Cuál es el país más grande del mundo por superficie?',
      options: ['Canadá', 'China', 'Rusia', 'Estados Unidos'],
      correct: 2,
    },
    {
      category: 'Geografía', emoji: '🗺️',
      question: '¿Cuál es la capital de Australia?',
      options: ['Sídney', 'Melbourne', 'Brisbane', 'Canberra'],
      correct: 3,
    },
    {
      category: 'Geografía', emoji: '🗺️',
      question: '¿En qué continente se encuentra el desierto del Sahara?',
      options: ['Asia', 'América', 'África', 'Australia'],
      correct: 2,
    },
    {
      category: 'Geografía', emoji: '🗺️',
      question: '¿Cuál es el océano más grande del mundo?',
      options: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'],
      correct: 3,
    },
  ],
  // HISTORIA
  [
    {
      category: 'Historia', emoji: '📜',
      question: '¿En qué año llegó Cristóbal Colón a América?',
      options: ['1502', '1510', '1489', '1492'],
      correct: 3,
    },
    {
      category: 'Historia', emoji: '📜',
      question: '¿En qué año comenzó la Segunda Guerra Mundial?',
      options: ['1941', '1936', '1945', '1939'],
      correct: 3,
    },
    {
      category: 'Historia', emoji: '📜',
      question: '¿Quién fue el primer presidente de los Estados Unidos?',
      options: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'],
      correct: 2,
    },
    {
      category: 'Historia', emoji: '📜',
      question: '¿En qué año cayó el Imperio Romano de Occidente?',
      options: ['410', '395', '476', '527'],
      correct: 2,
    },
  ],
]

function pickQuestions(): Question[] {
  return QUESTION_POOLS.map(pool => pool[Math.floor(Math.random() * pool.length)])
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

// ─── Fireworks canvas ─────────────────────────────────────────────────────────

interface FireParticle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  color: string
  size: number
}

function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = [
      '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2',
      '#ef476f', '#a8dadc', '#f4a261', '#c77dff',
      '#ffbe0b', '#fb5607',
    ]

    const particles: FireParticle[] = []

    function burst(x: number, y: number) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const count = 55 + Math.floor(Math.random() * 20)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3
        const speed = Math.random() * 5 + 1.5
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: Math.random() * 3 + 1,
        })
      }
    }

    let frameId: number
    let tick = 0

    // Initial volley
    const initialBursts = [0, 250, 500, 800, 1100]
    initialBursts.forEach(delay => {
      setTimeout(() => {
        if (!canvas) return
        burst(
          canvas.width * (0.2 + Math.random() * 0.6),
          canvas.height * (0.1 + Math.random() * 0.5),
        )
      }, delay)
    })

    function animate() {
      frameId = requestAnimationFrame(animate)
      // Semi-transparent fade so trails look nice
      ctx.fillStyle = 'rgba(2, 6, 23, 0.18)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      tick++
      // New burst every ~55 frames (~0.9s at 60fps)
      if (tick % 55 === 0) {
        burst(
          canvas.width * (0.1 + Math.random() * 0.8),
          canvas.height * (0.05 + Math.random() * 0.55),
        )
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.06 // gravity
        p.vx *= 0.99  // drag
        p.alpha -= 0.013

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.shadowBlur = 6
        ctx.shadowColor = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}

// ─── Celebration Screen ───────────────────────────────────────────────────────

function CelebrationScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 relative flex flex-col items-center justify-center gap-8 p-6 overflow-hidden">
      <FireworksCanvas />

      <div className="relative z-10 text-center space-y-4">
        <div className="text-6xl animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">
          ¡Felicidades!<br />Has superado con éxito<br />la primera fase
        </h2>
        <p className="text-slate-300 text-lg drop-shadow">
          Ahora vamos con la prueba final...
        </p>
      </div>

      <button
        onClick={onContinue}
        className="relative z-10 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xl rounded-2xl transition-all shadow-lg shadow-emerald-950/60"
      >
        ¡A por el puzzle! 🧩
      </button>
    </div>
  )
}

// ─── Start Screen ─────────────────────────────────────────────────────────────

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-10 p-6">
      <div className="text-center space-y-3">
        <div className="text-7xl">🎂</div>
        <h1 className="text-4xl font-bold text-white leading-tight">
          Feliz cumpleaños<br />Faso
        </h1>
        <p className="text-slate-400 text-lg">Supera el trivial para desbloquear la sorpresa</p>
      </div>

      <button
        onClick={onStart}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xl rounded-2xl transition-all shadow-lg shadow-blue-950/60"
      >
        ¡Aceptar el reto! 🎯
      </button>
    </div>
  )
}

// ─── Trivia Screen ────────────────────────────────────────────────────────────

function TriviaScreen({ onPass }: { onPass: () => void }) {
  const [questions, setQuestions] = useState<Question[]>(() => pickQuestions())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)

  const currentQ = questions[currentIdx]
  const finalScore = answers.filter((ans, i) => ans === questions[i]?.correct).length
  const passed = finalScore >= 4

  const handleSelect = (optionIdx: number) => {
    if (selected !== null) return
    setSelected(optionIdx)

    setTimeout(() => {
      const newAnswers = [...answers, optionIdx]
      setAnswers(newAnswers)
      if (currentIdx >= 4) {
        setShowResult(true)
      } else {
        setCurrentIdx(i => i + 1)
        setSelected(null)
      }
    }, 1200)
  }

  const handleRetry = () => {
    setQuestions(pickQuestions())
    setCurrentIdx(0)
    setSelected(null)
    setAnswers([])
    setShowResult(false)
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8 p-6">
        <div className="text-7xl">{passed ? '🏆' : '😅'}</div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">
            {passed ? '¡Pasaste el reto!' : '¡Casi lo logras!'}
          </h2>
          <p className="text-2xl font-semibold text-slate-300">
            {finalScore}{' '}
            <span className="text-slate-500 text-lg font-normal">de 5 correctas</span>
          </p>
          {!passed && (
            <p className="text-slate-500 text-sm">Necesitas mínimo 4 para continuar</p>
          )}
        </div>

        {/* Score breakdown */}
        <div className="flex gap-2">
          {questions.map((q, i) => (
            <div
              key={i}
              title={q.category}
              className={`w-11 h-11 rounded-full flex flex-col items-center justify-center gap-0.5 ${
                answers[i] === q.correct ? 'bg-emerald-700' : 'bg-red-800'
              }`}
            >
              <span className="text-xs">{q.emoji}</span>
              <span className="text-white text-xs font-bold">
                {answers[i] === q.correct ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>

        {passed ? (
          <button
            onClick={onPass}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xl rounded-2xl transition-all shadow-lg shadow-emerald-950/60"
          >
            ¡Continuar! 🎉
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xl rounded-2xl transition-all shadow-lg shadow-blue-950/60"
          >
            🔄 Intentar de nuevo
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5 p-5">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Trivial Relámpago ⚡</h2>
        <p className="text-slate-500 text-xs mt-0.5">Acierta 4 de 5 para desbloquear el puzzle</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < currentIdx
                ? 'w-6 bg-blue-500'
                : i === currentIdx
                ? 'w-6 bg-white'
                : 'w-2 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Category badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full">
        <span className="text-lg">{currentQ.emoji}</span>
        <span className="text-slate-300 text-sm font-medium">{currentQ.category}</span>
        <span className="text-slate-600 text-xs">· {currentIdx + 1}/5</span>
      </div>

      {/* Question */}
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-5 shadow-xl">
        <p className="text-white text-lg font-semibold leading-snug text-center">
          {currentQ.question}
        </p>
      </div>

      {/* Options */}
      <div className="w-full max-w-sm space-y-2.5">
        {currentQ.options.map((option, idx) => {
          const hasSelected = selected !== null
          const isCorrect = idx === currentQ.correct
          const isSelected = selected === idx

          let classes =
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 '

          if (!hasSelected) {
            classes += 'bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white cursor-pointer'
          } else if (isCorrect) {
            classes += 'bg-emerald-700 text-white ring-2 ring-emerald-400'
          } else if (isSelected) {
            classes += 'bg-red-800 text-white ring-2 ring-red-400'
          } else {
            classes += 'bg-slate-800 text-slate-500 opacity-50 cursor-default'
          }

          const labelBg =
            hasSelected && isCorrect
              ? 'bg-emerald-500'
              : hasSelected && isSelected
              ? 'bg-red-600'
              : 'bg-slate-700'

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={hasSelected}
              className={classes}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${labelBg}`}
              >
                {OPTION_LABELS[idx]}
              </span>
              <span className="text-sm">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tile ─────────────────────────────────────────────────────────────────────

function Tile({
  tileId,
  onClick,
  interactive,
}: {
  tileId: number
  onClick: () => void
  interactive: boolean
}) {
  const col = tileId % COLS
  const row = Math.floor(tileId / COLS)
  return (
    <div
      onClick={onClick}
      className={`transition-[filter,transform] duration-100 ${
        interactive ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''
      }`}
      style={{
        width: TILE_W,
        height: TILE_H,
        backgroundImage: `url(${IMAGE_URL})`,
        backgroundSize: `${COLS * TILE_W}px ${ROWS * TILE_H}px`,
        backgroundPosition: `${-col * TILE_W}px ${-row * TILE_H}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}

// ─── Game Screen ──────────────────────────────────────────────────────────────

function GameScreen({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<Board>(() => createShuffled())
  const [moves, setMoves] = useState(0)
  const [solved, setSolved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const moveTile = useCallback(
    (pos: number) => {
      if (solved) return
      const emptyIdx = board.indexOf(-1)
      if (!getNeighbors(emptyIdx).includes(pos)) return
      const next = [...board]
      ;[next[emptyIdx], next[pos]] = [next[pos], next[emptyIdx]]
      setBoard(next)
      setMoves(m => m + 1)
      if (checkSolved(next)) setSolved(true)
    },
    [board, solved],
  )

  const reshuffle = useCallback(() => {
    setBoard(createShuffled())
    setMoves(0)
    setSolved(false)
    setShowPreview(false)
  }, [])

  const handleSwipe = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || solved) return
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const dy = e.changedTouches[0].clientY - touchStart.current.y
      touchStart.current = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return

      const emptyIdx = board.indexOf(-1)
      const emptyCol = emptyIdx % COLS
      const emptyRow = Math.floor(emptyIdx / COLS)
      let tilePos = -1
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && emptyCol > 0) tilePos = emptyIdx - 1
        if (dx < 0 && emptyCol < COLS - 1) tilePos = emptyIdx + 1
      } else {
        if (dy > 0 && emptyRow > 0) tilePos = emptyIdx - COLS
        if (dy < 0 && emptyRow < ROWS - 1) tilePos = emptyIdx + COLS
      }
      if (tilePos !== -1) moveTile(tilePos)
    },
    [board, solved, moveTile],
  )

  const triggerPreview = useCallback(() => {
    setShowPreview(true)
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => setShowPreview(false), 3000)
  }, [])

  useEffect(() => {
    if (solved) return
    const handleKey = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      e.preventDefault()
      const emptyIdx = board.indexOf(-1)
      const emptyCol = emptyIdx % COLS
      const emptyRow = Math.floor(emptyIdx / COLS)
      let tilePos = -1
      if (e.key === 'ArrowLeft' && emptyCol < COLS - 1) tilePos = emptyIdx + 1
      if (e.key === 'ArrowRight' && emptyCol > 0) tilePos = emptyIdx - 1
      if (e.key === 'ArrowUp' && emptyRow < ROWS - 1) tilePos = emptyIdx + COLS
      if (e.key === 'ArrowDown' && emptyRow > 0) tilePos = emptyIdx - COLS
      if (tilePos === -1) return
      const next = [...board]
      ;[next[emptyIdx], next[tilePos]] = [next[tilePos], next[emptyIdx]]
      setBoard(next)
      setMoves(m => m + 1)
      if (checkSolved(next)) setSolved(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [board, solved])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5 p-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-white text-center leading-tight">
        Feliz cumpleaños Faso 🎂
      </h1>

      {/* Stats */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-white tabular-nums">{moves}</div>
          <div className="text-slate-500 text-xs uppercase tracking-widest mt-0.5">movimientos</div>
        </div>
        {solved && (
          <div className="text-xl font-bold text-emerald-400 animate-bounce">
            ¡Lo lograste! 🎉
          </div>
        )}
      </div>

      {/* Board */}
      <div
        className="relative"
        onTouchStart={e => {
          touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
        onTouchEnd={handleSwipe}
        style={{ touchAction: 'none' }}
      >
        {showPreview && (
          <div className="absolute inset-0 z-20 rounded-lg overflow-hidden ring-2 ring-blue-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGE_URL} alt="Vista previa" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-xs px-3 py-1 rounded-full">
              Vista previa · 3 segundos
            </div>
          </div>
        )}

        <div
          className={`grid gap-[2px] bg-slate-800 p-[2px] rounded-lg overflow-hidden transition-shadow ${
            solved ? 'ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-950/50' : ''
          }`}
          style={{ gridTemplateColumns: `repeat(${COLS}, ${TILE_W}px)` }}
        >
          {board.map((tileId, pos) => {
            const displayId = tileId === -1 && solved ? TILE_COUNT : tileId
            if (displayId === -1) {
              return (
                <div
                  key={`empty-${pos}`}
                  className="bg-slate-950"
                  style={{ width: TILE_W, height: TILE_H }}
                />
              )
            }
            return (
              <Tile
                key={`tile-${pos}`}
                tileId={displayId}
                onClick={() => moveTile(pos)}
                interactive={!solved}
              />
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={triggerPreview}
          disabled={showPreview}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
        >
          👁 Ver imagen (3s)
        </button>
        <button
          onClick={reshuffle}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
        >
          🔀 Barajar
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export function PuzzleGame() {
  const [phase, setPhase] = useState<'start' | 'trivia' | 'celebration' | 'game'>('start')

  if (phase === 'start') return <StartScreen onStart={() => setPhase('trivia')} />
  if (phase === 'trivia') return <TriviaScreen onPass={() => setPhase('celebration')} />
  if (phase === 'celebration') return <CelebrationScreen onContinue={() => setPhase('game')} />
  return <GameScreen key="game" onBack={() => setPhase('start')} />
}
