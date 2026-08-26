import { useMemo } from 'react'
import type { LayoutResult } from '../types'
import { REGIONS } from '../config/regions'
import { useViewStore } from '../store/view'
import { AXIS_WIDTH } from './TimeAxis'

export const HEADER_HEIGHT = 30

/**
 * Sticky top strip naming the lanes, aligned to where each lane actually
 * sits within the visible slice of time. Lane positions are read from the
 * emergent bands, averaged over the viewport's year range.
 */
export function RegionHeader({ layout }: { layout: LayoutResult }) {
  const camera = useViewStore((s) => s.camera)
  const viewport = useViewStore((s) => s.viewport)

  const entries = useMemo(() => {
    const { k, tx, ty } = camera
    const yTop = -ty / k
    const yBottom = (viewport.height - ty) / k
    const out: { id: string; name: string; color: string; x: number; w: number }[] =
      []
    for (const region of REGIONS) {
      const bands = layout.bands.filter(
        (b) => b.region === region.id && b.yEnd > yTop && b.yStart < yBottom,
      )
      if (bands.length === 0) continue
      const x0 = Math.min(...bands.map((b) => b.x))
      const x1 = Math.max(...bands.map((b) => b.x + b.width))
      const sx = x0 * k + tx
      const sw = (x1 - x0) * k
      if (sx + sw < 0 || sx > viewport.width || sw < 30) continue
      out.push({
        id: region.id,
        name: region.name,
        color: region.colorFamily,
        x: sx,
        w: sw,
      })
    }
    // Lanes overlap horizontally when a wide time range is visible. Keep
    // the widest lanes' names and drop any label that would collide.
    out.sort((a, b) => b.w - a.w)
    const kept: typeof out = []
    for (const e of out) {
      const textW = e.name.length * 6.4 + 16
      const cx = e.x + e.w / 2
      const collides = kept.some((k2) => {
        const kw = k2.name.length * 6.4 + 16
        return Math.abs(cx - (k2.x + k2.w / 2)) < (textW + kw) / 2
      })
      if (!collides) kept.push(e)
    }
    return kept
  }, [layout, camera, viewport])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: AXIS_WIDTH,
        right: 0,
        height: HEADER_HEIGHT,
        overflow: 'hidden',
        borderBottom: '1px solid rgba(26,22,20,0.25)',
        background: 'var(--paper)',
        fontFamily: 'var(--font-label)',
        zIndex: 9,
      }}
    >
      {entries.map((e) => (
        <div
          key={e.id}
          style={{
            position: 'absolute',
            left: e.x,
            width: e.w,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color: 'var(--ink)',
              borderBottom: `3px solid ${e.color}`,
              paddingBottom: 1,
            }}
          >
            {e.name}
          </span>
        </div>
      ))}
    </div>
  )
}
