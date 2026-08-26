import { useMemo } from 'react'
import type { LayoutConfig } from '../types'
import { layout } from '../layout/engine'
import { DEFAULT_SCALE } from '../layout/scale'
import { loadFixture } from '../data/fixture'
import { getRegion } from '../config/regions'
import { labelColorOn, strokeFor } from '../config/color'

/**
 * Phase 1 debug view. Not the product: a plain SVG dump of the engine's
 * output so packing bugs are visible before any real rendering exists.
 */
const CONFIG: LayoutConfig = {
  scale: DEFAULT_SCALE,
  width: 1200,
  sliceYears: 25,
  gap: 0,
  nestInset: 3,
  minRectWidth: 8,
  anchorStrength: 0.85,
}

const AXIS_W = 70

export function DebugSvg() {
  const result = useMemo(() => layout(loadFixture(), CONFIG), [])
  const ticks = useMemo(() => {
    const out: { year: number; y: number }[] = []
    for (let year = -4000; year <= 2000; year += 500) {
      out.push({ year, y: DEFAULT_SCALE.yearToY(year) })
    }
    return out
  }, [])

  return (
    <svg
      width={result.width + AXIS_W + 20}
      height={result.height + 20}
      style={{ background: '#FAF0EC', display: 'block' }}
    >
      <g>
        {ticks.map((t) => (
          <g key={t.year}>
            <line
              x1={AXIS_W - 6}
              x2={result.width + AXIS_W}
              y1={t.y + 10}
              y2={t.y + 10}
              stroke="#1A1614"
              strokeOpacity={0.12}
            />
            <text
              x={AXIS_W - 10}
              y={t.y + 13}
              textAnchor="end"
              fontSize={9}
              fill="#1A1614"
              fontFamily="var(--font-label)"
            >
              {t.year < 0 ? `${-t.year} BCE` : `${t.year} CE`}
            </text>
          </g>
        ))}
      </g>
      <g transform={`translate(${AXIS_W}, 10)`}>
        {result.rects.map((r) => {
          const region = getRegion(r.region)
          const fill = region.tints[2 - Math.min(r.depth, 2)]!
          return (
            <g key={r.polityId}>
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill={fill}
                stroke={strokeFor(fill)}
                strokeWidth={1}
              />
              {r.width > 28 && r.height > 10 && (
                <text
                  x={r.x + r.width / 2}
                  y={r.y + Math.min(r.height / 2 + 3, 14)}
                  textAnchor="middle"
                  fontSize={Math.min(10, r.width / 6)}
                  fill={labelColorOn(fill)}
                  fontFamily="var(--font-label)"
                >
                  {r.polityId}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
