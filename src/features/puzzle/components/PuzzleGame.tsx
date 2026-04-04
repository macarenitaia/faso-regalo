'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

const COLS = 3
const ROWS = 5
const TOTAL = COLS * ROWS // 15 cells
const TILE_COUNT = TOTAL - 1 // 14 moveable tiles (0-13), tile 14 = hidden empty slot
const TILE_W = 110
const TILE_H = 110

type Board = number[] // length 15, values 0..13 or -1 (empty)

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

// ─── Upload Screen ───────────────────────────────────────────────────────────

function UploadScreen({ onFile }: { onFile: (f: File) => void }) {
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onFile(file)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
            Feliz cumpleaños Faso
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Sube una foto y reconstruye la imagen</p>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 cursor-pointer transition-all select-none ${
            dragOver
              ? 'border-blue-400 bg-blue-950/30 scale-[1.02]'
              : 'border-slate-700 hover:border-slate-500 hover:bg-slate-900/40'
          }`}
        >
          <div className="text-5xl mb-3">🎂</div>
          <p className="text-slate-200 font-medium text-lg">
            {dragOver ? 'Suelta aquí' : 'Arrastra una imagen'}
          </p>
          <p className="text-slate-500 text-sm mt-1">o haz clic para seleccionar</p>
          <p className="text-slate-700 text-xs mt-3">PNG · JPG · WEBP</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        />

        <p className="text-slate-700 text-sm">
          Cuadrícula 3×5 · 14 piezas · Toca o desliza para jugar
        </p>
      </div>
    </div>
  )
}

// ─── Tile ────────────────────────────────────────────────────────────────────

function Tile({
  tileId,
  imageUrl,
  onClick,
  interactive,
}: {
  tileId: number
  imageUrl: string
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
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: `${COLS * TILE_W}px ${ROWS * TILE_H}px`,
        backgroundPosition: `${-col * TILE_W}px ${-row * TILE_H}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}

// ─── Game Screen ─────────────────────────────────────────────────────────────

function GameScreen({
  imageUrl,
  onChangeImage,
}: {
  imageUrl: string
  onChangeImage: () => void
}) {
  const [board, setBoard] = useState<Board>(() => createShuffled())
  const [moves, setMoves] = useState(0)
  const [solved, setSolved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
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
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return // tap — onClick handles it

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

  // Keyboard: arrow keys move the tile opposite to the arrow direction
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
        {/* Preview overlay */}
        {showPreview && (
          <div className="absolute inset-0 z-20 rounded-lg overflow-hidden ring-2 ring-blue-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-xs px-3 py-1 rounded-full">
              Vista previa · 3 segundos
            </div>
          </div>
        )}

        {/* Tiles grid */}
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
                imageUrl={imageUrl}
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
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
        >
          📷 Cambiar foto
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (!f) return
          const newUrl = URL.createObjectURL(f)
          URL.revokeObjectURL(imageUrl)
          onChangeImage()
          setTimeout(() => {
            const event = new CustomEvent('puzzle:newimage', { detail: newUrl })
            window.dispatchEvent(event)
          }, 0)
        }}
      />
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function PuzzleGame() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      setImageUrl(URL.createObjectURL(file))
    },
    [imageUrl],
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const url = (e as CustomEvent<string>).detail
      setImageUrl(url)
    }
    window.addEventListener('puzzle:newimage', handler)
    return () => window.removeEventListener('puzzle:newimage', handler)
  }, [])

  if (!imageUrl) {
    return <UploadScreen onFile={handleFile} />
  }

  return (
    <GameScreen
      key={imageUrl}
      imageUrl={imageUrl}
      onChangeImage={() => setImageUrl(null)}
    />
  )
}
