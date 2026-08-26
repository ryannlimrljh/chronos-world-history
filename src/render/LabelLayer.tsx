import { useMemo } from 'react'
import type { LayoutResult, Polity } from '../types'
import { labelColorOn } from '../config/color'
import { useViewStore } from '../store/view'
import { styleFor } from './paint'

/**
 * Semantic zoom labels. A rect earns a label only when its on-screen box is
 * big enough for one, and bigger rects earn bigger type. Far out, only the
 * significance-5 giants are named; zooming in reveals tiers beneath.
 *
 * DOM rather than canvas so text stays crisp at any zoom and can be styled
 * with the label face. Count is capped: labels are texture, not a list.
 */

const MAX_LABELS = 220

interface LabelSpec {
  id: string
  x: number
  y: number
  w: number
  h: number
  fontSize: number
  color: string
  name: string
  nameNative: string | undefined
  showNative: boolean
}

export function LabelLayer({
  layout,
  polities,
}: {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
}) {
  const camera = useViewStore((s) => s.camera)
  const viewport = useViewStore((s) => s.viewport)

  const labels = useMemo(() => {
    const out: LabelSpec[] = []
    const { k, tx, ty } = camera
    for (const rect of layout.rects) {
      const x = rect.x * k + tx
      const y = rect.y * k + ty
      const w = rect.width * k
      const h = rect.height * k
      if (x + w < 0 || y + h < 0 || x > viewport.width || y > viewport.height)
        continue
      // Entry threshold scales with significance: giants label first.
      const minArea = 3600 / rect.significance
      if (w * h < minArea || w < 26 || h < 11) continue
      const polity = polities.get(rect.polityId)
      if (!polity) continue
      // Size to the rect, never overflow it. Uppercase Barlow Condensed
      // runs ~0.52em per character; a label that would need less than 7px
      // to fit is dropped, not clipped.
      const fontSize = Math.min(
        26,
        Math.sqrt(w * h) / 7,
        (w * 0.94) / (polity.name.length * 0.52),
        h * 0.8,
      )
      if (fontSize < 7) continue
      // Centre the label in the VISIBLE part of the rect, so a block taller
      // than the screen keeps its name on screen while you pan through it.
      const vx = Math.max(x, 0)
      const vy = Math.max(y, 0)
      const vw = Math.min(x + w, viewport.width) - vx
      const vh = Math.min(y + h, viewport.height) - vy
      out.push({
        id: rect.polityId,
        x: vx,
        y: vy,
        w: vw,
        h: vh,
        fontSize,
        color: labelColorOn(styleFor(rect).fill),
        name: polity.name,
        nameNative: polity.nameNative,
        showNative: Boolean(polity.nameNative) && h > fontSize * 2.6,
      })
    }
    out.sort((a, b) => b.w * b.h - a.w * a.h)
    return out.slice(0, MAX_LABELS)
  }, [layout, polities, camera, viewport])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {labels.map((l) => (
        <div
          key={l.id}
          style={{
            position: 'absolute',
            left: l.x,
            top: l.y,
            width: l.w,
            height: l.h,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            color: l.color,
            fontFamily: 'var(--font-label)',
            textAlign: 'center',
            lineHeight: 1.05,
          }}
        >
          <span
            style={{
              fontSize: l.fontSize,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {l.name}
          </span>
          {l.showNative && l.nameNative && (
            <span style={{ fontSize: l.fontSize * 0.7, opacity: 0.85 }}>
              {l.nameNative}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
