import { useEffect, useMemo } from 'react'
import type { LayoutResult } from '../types'
import { useAppStore } from '../store/app'
import { useViewStore } from '../store/view'

/** A brief expanding ring over a rect after a search jump. */
export function PulseOverlay({ layout }: { layout: LayoutResult }) {
  const pulseId = useAppStore((s) => s.pulseId)
  const setPulse = useAppStore((s) => s.setPulse)
  const camera = useViewStore((s) => s.camera)

  const rect = useMemo(
    () => layout.rects.find((r) => r.polityId === pulseId),
    [layout, pulseId],
  )

  useEffect(() => {
    if (!pulseId) return
    const t = setTimeout(() => setPulse(null), 1600)
    return () => clearTimeout(t)
  }, [pulseId, setPulse])

  if (!rect) return null
  const { k, tx, ty } = camera
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x * k + tx - 4,
        top: rect.y * k + ty - 4,
        width: rect.width * k + 8,
        height: rect.height * k + 8,
        border: '2px solid var(--ink)',
        pointerEvents: 'none',
        zIndex: 18,
        animation: 'chronos-pulse 0.8s ease-out 2',
      }}
    />
  )
}
