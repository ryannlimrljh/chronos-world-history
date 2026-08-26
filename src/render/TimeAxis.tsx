import { useMemo } from 'react'
import type { TimeScale } from '../types'
import { ERAS } from '../config/eras'
import { useViewStore } from '../store/view'
import { useAppStore } from '../store/app'
import { eraName } from '../i18n'
import { centerOnYearRange } from '../interact/camera'

/**
 * The fixed left gutter: year ticks and era brackets. It pans vertically
 * with the mosaic but never horizontally — it is the ruler the whole
 * document is read against. Year 1 CE gets the emphatic filled pill.
 */

// Narrow screens get a slimmer ruler and fold the era-bracket rail away;
// the era name still lives in the position readout.
const NARROW = typeof window !== 'undefined' && window.innerWidth < 640
export const AXIS_WIDTH = NARROW ? 58 : 92
const SHOW_ERA_RAIL = !NARROW

function formatYear(year: number): string {
  if (year < 0) return `${-year}`
  return `${year}`
}

/** Pick a tick step that keeps labels readable at the current zoom. */
function tickStep(pxPerYearOnScreen: number): number {
  const targetPx = 48
  const steps = [1000, 500, 200, 100, 50, 25, 10, 5, 1]
  for (const s of steps) {
    if (s * pxPerYearOnScreen <= targetPx * 4) return s
  }
  return 1
}

export function TimeAxis({ scale }: { scale: TimeScale }) {
  const camera = useViewStore((s) => s.camera)
  const viewport = useViewStore((s) => s.viewport)
  const lang = useAppStore((s) => s.lang)

  const { ticks, eraBands } = useMemo(() => {
    const { k, ty } = camera
    const yearTop = scale.yToYear(-ty / k)
    const yearBottom = scale.yToYear((viewport.height - ty) / k)
    // Approximate on-screen px per year mid-viewport to choose the step.
    const midYear = (yearTop + yearBottom) / 2
    const pxPerYear =
      (scale.yearToY(midYear + 50) - scale.yearToY(midYear - 50)) / 100
    const step = tickStep(pxPerYear * k)

    const first = Math.ceil(yearTop / step) * step
    const ticksOut: { year: number; y: number }[] = []
    for (let year = first; year <= yearBottom; year += step) {
      if (year === 0) continue // no year zero
      ticksOut.push({ year, y: scale.yearToY(year) * k + ty })
    }

    const erasOut = ERAS.map((era) => ({
      era,
      y0: scale.yearToY(era.start) * k + ty,
      y1: scale.yearToY(era.end) * k + ty,
    })).filter((b) => b.y1 > 0 && b.y0 < viewport.height)

    const yearOneY = scale.yearToY(1) * k + ty
    return { ticks: ticksOut, eraBands: erasOut, yearOneY }
  }, [scale, camera, viewport])

  const yearOneY = scale.yearToY(1) * camera.k + camera.ty

  return (
    <div
      style={{
        position: 'absolute',
        top: 30, // below the region header; camera y is viewport-relative
        left: 0,
        bottom: 0,
        width: AXIS_WIDTH,
        overflow: 'hidden',
        borderRight: '1px solid rgba(26,22,20,0.25)',
        background: 'var(--paper)',
        fontFamily: 'var(--font-label)',
        zIndex: 10,
      }}
    >
      {/* Era brackets, rotated, far left */}
      {SHOW_ERA_RAIL && eraBands.map(({ era, y0, y1 }) => (
        <div
          key={era.id}
          onClick={() =>
            centerOnYearRange(
              scale.yearToY(era.start),
              scale.yearToY(era.end),
            )
          }
          title={eraName(era, lang)}
          style={{
            position: 'absolute',
            left: 0,
            top: y0,
            height: y1 - y0,
            width: 26,
            borderRight: '1px solid rgba(26,22,20,0.35)',
            borderTop: '1px solid rgba(26,22,20,0.35)',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {y1 - y0 > 54 && (
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%) rotate(180deg)',
                writingMode: 'vertical-rl',
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                color: 'var(--ink)',
                opacity: 0.75,
              }}
            >
              {eraName(era, lang)}
            </span>
          )}
        </div>
      ))}
      {/* Year ticks */}
      {ticks.map((t) => (
        <div key={t.year}>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: t.y,
              width: 8,
              borderTop: '1px solid rgba(26,22,20,0.55)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: t.y - 6,
              fontSize: 10,
              color: 'var(--ink)',
              fontWeight: 500,
            }}
          >
            {formatYear(t.year)}
            {t.year < 0 && (
              <span style={{ fontSize: 7, opacity: 0.6 }}> BCE</span>
            )}
          </div>
        </div>
      ))}
      {/* Year 1 CE: the pivot pill */}
      <div
        style={{
          position: 'absolute',
          right: 6,
          top: yearOneY - 8,
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          padding: '2px 8px',
          borderRadius: 8,
        }}
      >
        1 CE
      </div>
    </div>
  )
}
