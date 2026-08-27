import { useEffect, useRef } from 'react'
import type { LayoutResult, Polity } from '../types'
import { useViewStore } from '../store/view'
import { useAppStore } from '../store/app'
import { isDimmed } from '../interact/dim'
import { paintMosaic } from './paint'

/**
 * The base layer: a single canvas repainted on camera change via rAF.
 * Repaints are coalesced — many camera updates in one frame cause one draw.
 */
export function CanvasMosaic({
  layout,
  polities,
}: {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let dirty = true
    const draw = () => {
      raf = 0
      if (!dirty) return
      dirty = false
      const { camera, viewport } = useViewStore.getState()
      const { filters, timeCursor, selectedId, hoveredId, compareIds, spotlightIds } =
        useAppStore.getState()
      const dimmedIds = new Set<string>()
      for (const p of polities.values()) {
        if (isDimmed(p, filters, timeCursor, spotlightIds)) dimmedIds.add(p.id)
      }
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(viewport.width)
      const h = Math.round(viewport.height)
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintMosaic(ctx, layout, camera, w, h, {
        dimmedIds,
        selectedId,
        hoveredId,
        compareIds,
      })
    }
    const schedule = () => {
      dirty = true
      if (!raf) raf = requestAnimationFrame(draw)
    }

    schedule()
    const unsubView = useViewStore.subscribe(schedule)
    const unsubApp = useAppStore.subscribe(schedule)
    return () => {
      unsubView()
      unsubApp()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [layout, polities])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, display: 'block' }}
    />
  )
}
