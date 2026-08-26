import { useMemo } from 'react'
import type { LayoutResult, Polity } from '../types'
import { labelColorOn } from '../config/color'
import { useViewStore } from '../store/view'
import { useAppStore } from '../store/app'
import { isDimmed } from '../interact/dim'
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
  /** Tall narrow columns take vertical text, as the reference does. */
  vertical: boolean
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
  const filters = useAppStore((s) => s.filters)
  const timeCursor = useAppStore((s) => s.timeCursor)

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
      if (w * h < minArea || h < 11) continue
      const polity = polities.get(rect.polityId)
      if (!polity) continue
      if (isDimmed(polity, filters, timeCursor)) continue
      // Tall narrow columns take vertical text, exactly as the reference
      // poster does; everything else labels horizontally. Size to the
      // rect, never overflow it. Uppercase Barlow Condensed runs ~0.52em
      // per character; a label needing less than 7px is dropped.
      const vertical = h > w * 2.2
      const rawSize = vertical
        ? Math.min(
            22,
            w * 0.72,
            (h * 0.92) / (polity.name.length * 0.52),
          )
        : Math.min(
            26,
            Math.sqrt(w * h) / 7,
            (w * 0.94) / (polity.name.length * 0.52),
            h * 0.8,
          )
      if (rawSize < 7 || (!vertical && w < 26) || (vertical && w < 10)) continue
      // Quantize to five tiers: the reference reads as five deliberate
      // label sizes on screen at once, not a continuous smear.
      const TIERS = [8, 10.5, 14, 19, 26]
      const fontSize = [...TIERS].reverse().find((t) => t <= rawSize) ?? 8
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
        showNative:
          Boolean(polity.nameNative) &&
          (vertical ? w > fontSize * 2.4 : h > fontSize * 2.6),
        vertical,
      })
    }
    out.sort((a, b) => b.w * b.h - a.w * a.h)
    return out.slice(0, MAX_LABELS)
  }, [layout, polities, camera, viewport, filters, timeCursor])

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
            flexDirection: l.vertical ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            color: l.color,
            fontFamily: 'var(--font-label)',
            textAlign: 'center',
            lineHeight: 1.05,
            writingMode: l.vertical ? 'vertical-rl' : undefined,
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
