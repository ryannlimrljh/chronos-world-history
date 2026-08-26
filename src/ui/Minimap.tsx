import { useEffect, useRef } from 'react'
import type { LayoutResult } from '../types'
import { getRegion } from '../config/regions'
import { useViewStore } from '../store/view'
import { centerAtWorld } from '../interact/camera'
import { useAppStore } from '../store/app'
import { ui } from '../i18n'
import { useRightOffset } from './chrome'

/**
 * The you-are-here map: a thumbnail of the whole poster with a rectangle
 * marking the current viewport. Click or drag anywhere on it to jump.
 * The thumbnail is painted once per layout; only the rectangle moves.
 */

const MINI_W = typeof window !== 'undefined' && window.innerWidth < 640 ? 88 : 132

export function Minimap({ layout }: { layout: LayoutResult }) {
  const baseRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const camera = useViewStore((s) => s.camera)
  const viewport = useViewStore((s) => s.viewport)
  const world = useViewStore((s) => s.world)
  const right = useRightOffset()
  const lang = useAppStore((s) => s.lang)

  const m = MINI_W / Math.max(world.width, 1)
  const miniH = Math.round(world.height * m)

  // Paint the thumbnail once per layout.
  useEffect(() => {
    const canvas = baseRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = MINI_W * dpr
    canvas.height = miniH * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, MINI_W, miniH)
    for (const rect of layout.rects) {
      if (rect.depth > 0) continue
      ctx.fillStyle = getRegion(rect.region).colorFamily
      for (const run of rect.runs) {
        ctx.fillRect(
          run.x0 * m,
          run.y0 * m,
          Math.max((run.x1 - run.x0) * m, 0.5),
          Math.max((run.y1 - run.y0) * m, 0.5),
        )
      }
    }
  }, [layout, m, miniH])

  // The viewport rectangle in minimap space.
  const vx = (-camera.tx / camera.k) * m
  const vy = (-camera.ty / camera.k) * m
  const vw = (viewport.width / camera.k) * m
  const vh = (viewport.height / camera.k) * m

  const jump = (e: React.PointerEvent) => {
    const box = frameRef.current?.getBoundingClientRect()
    if (!box) return
    centerAtWorld(
      (e.clientX - box.left) / m,
      (e.clientY - box.top) / m,
    )
  }

  return (
    <div
      ref={frameRef}
      onPointerDown={(e) => {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        jump(e)
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) jump(e)
      }}
      aria-label="Overview map"
      data-tip={ui('minimapTip', 'Overview map · click or drag to jump', lang)}
      className="chronos-shift"
      style={{
        position: 'absolute',
        right,
        bottom: 56,
        width: MINI_W,
        height: miniH,
        border: '1px solid rgba(26,22,20,0.45)',
        background: 'var(--paper)',
        cursor: 'crosshair',
        zIndex: 24,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <canvas
        ref={baseRef}
        style={{ width: MINI_W, height: miniH, display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(vx, MINI_W - 4)),
          top: Math.max(0, Math.min(vy, miniH - 4)),
          width: Math.min(vw, MINI_W),
          height: Math.min(vh, miniH),
          border: '1.5px solid var(--ink)',
          background: 'rgba(26,22,20,0.06)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
