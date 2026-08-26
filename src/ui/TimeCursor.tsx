import { useEffect, useRef, useState } from 'react'
import type { Polity, TimeScale } from '../types'
import { useAppStore } from '../store/app'
import { useViewStore } from '../store/view'
import { formatYear } from '../interact/format'

/**
 * The draggable time cursor: a horizontal ink line across the mosaic.
 * While set, everything not alive at that year desaturates (via the shared
 * dim rule), and a readout shows the year plus the count of concurrent
 * polities. Toggled with the T key or the handle button; dragged directly.
 */
export function TimeCursor({
  scale,
  polities,
}: {
  scale: TimeScale
  polities: ReadonlyMap<string, Polity>
}) {
  const timeCursor = useAppStore((s) => s.timeCursor)
  const setTimeCursor = useAppStore((s) => s.setTimeCursor)
  const camera = useViewStore((s) => s.camera)
  const viewport = useViewStore((s) => s.viewport)
  const [dragging, setDragging] = useState(false)
  const lineRef = useRef<HTMLDivElement>(null)

  // Keyboard toggle: T places the cursor mid-viewport, Esc-like re-press clears.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 't') return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const { timeCursor } = useAppStore.getState()
      if (timeCursor !== null) {
        setTimeCursor(null)
      } else {
        const { camera, viewport } = useViewStore.getState()
        const midWorldY = (viewport.height / 2 - camera.ty) / camera.k
        setTimeCursor(Math.round(scale.yToYear(midWorldY)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scale, setTimeCursor])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent) => {
      const parent = lineRef.current?.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const { camera } = useViewStore.getState()
      const worldY = (e.clientY - rect.top - camera.ty) / camera.k
      setTimeCursor(Math.round(scale.yToYear(worldY)))
    }
    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, scale, setTimeCursor])

  if (timeCursor === null) return null
  const y = scale.yearToY(timeCursor) * camera.k + camera.ty
  if (y < -20 || y > viewport.height + 20) return null

  const count = [...polities.values()].filter(
    (p) => p.start <= timeCursor && p.end >= timeCursor,
  ).length

  return (
    <div
      ref={lineRef}
      style={{ position: 'absolute', left: 0, right: 0, top: y, zIndex: 15, pointerEvents: 'none' }}
    >
      <div style={{ borderTop: '2px solid var(--ink)', opacity: 0.85 }} />
      <div
        onPointerDown={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        style={{
          position: 'absolute',
          left: 10,
          top: -13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontFamily: 'var(--font-label)',
          fontSize: 12,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 10,
          cursor: 'ns-resize',
          pointerEvents: 'auto',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <span>{formatYear(timeCursor)}</span>
        <span style={{ opacity: 0.7, fontWeight: 400 }}>{count} polities</span>
        <span
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setTimeCursor(null)}
          style={{ cursor: 'pointer', opacity: 0.7 }}
        >
          ✕
        </span>
      </div>
    </div>
  )
}
