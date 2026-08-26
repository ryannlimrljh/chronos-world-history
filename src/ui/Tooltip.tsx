import { useEffect, useState } from 'react'
import type { LayoutResult, Polity } from '../types'
import { useAppStore } from '../store/app'
import { formatRange, durationYears } from '../interact/format'
import { polityName, politySecondary, ui } from '../i18n'

/**
 * Lightweight hover tooltip following the cursor: name, native name, dated
 * range with precision markers, and duration. Hairline border, no shadow.
 */
export function Tooltip({
  polities,
}: {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
}) {
  const hoveredId = useAppStore((s) => s.hoveredId)
  const lang = useAppStore((s) => s.lang)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  if (!hoveredId) return null
  const p = polities.get(hoveredId)
  if (!p) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: Math.min(pos.x + 14, window.innerWidth - 240),
        top: pos.y + 16,
        maxWidth: 230,
        background: 'var(--paper)',
        border: '1px solid rgba(26,22,20,0.45)',
        padding: '6px 9px',
        pointerEvents: 'none',
        zIndex: 40,
        fontFamily: 'var(--font-label)',
        lineHeight: 1.25,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {polityName(p, lang)}
      </div>
      {politySecondary(p, lang) && (
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {politySecondary(p, lang)}
        </div>
      )}
      <div style={{ fontSize: 12, marginTop: 2 }}>
        {formatRange(p)}
        <span style={{ opacity: 0.6 }}>
          {' '}· {durationYears(p)} {ui('years', 'yrs', lang)}
        </span>
      </div>
    </div>
  )
}
