'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

const COLS = 4
const ROWS = 3
const TOTAL = COLS * ROWS // 12 cells
const TILE_COUNT = TOTAL - 1 // 11 moveable tiles (0-10)
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

// ─── Start Screen ────────────────────────────────────────────────────────────

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-10 p-6">
      <div className="text-center space-y-3">
        <div className="text-7xl">🎂</div>
        <h1 className="text-4xl font-bold text-white leading-tight">
          Feliz cumpleaños<br />Faso
        </h1>
        <p className="text-slate-400 text-lg">Reconstruye la imagen para ver la sorpresa</p>
      </div>

      <button
        onClick={onStart}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xl rounded-2xl transition-all shadow-lg shadow-blue-950/60"
      >
        Dale click para empezar
      </button>
    </div>
  )
}

// ─── Tile ────────────────────────────────────────────────────────────────────

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

// ─── Game Screen ─────────────────────────────────────────────────────────────

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
        onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export function PuzzleGame() {
  const [started, setStarted] = useState(false)

  if (!started) return <StartScreen onStart={() => setStarted(true)} />

  return <GameScreen key="game" onBack={() => setStarted(false)} />
}
