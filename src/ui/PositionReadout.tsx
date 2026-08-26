import { eraForYear } from '../config/eras'
import { useAppStore } from '../store/app'
import { useViewStore } from '../store/view'
import { DEFAULT_SCALE } from '../layout/scale'
import { formatYear } from '../interact/format'
import { eraName } from '../i18n'

/**
 * You-are-here chip: the year at the viewport's centre and its era.
 * Reads the camera continuously; costs one small div.
 */
export function PositionReadout() {
  const camera = useViewStore((s) => s.camera)
  const viewport = useViewStore((s) => s.viewport)
  const lang = useAppStore((s) => s.lang)

  const midYear = Math.round(
    DEFAULT_SCALE.yToYear((viewport.height / 2 - camera.ty) / camera.k),
  )
  const era = eraForYear(midYear)

  return (
    <div
      style={{
        position: 'absolute',
        left: 102,
        bottom: 14,
        zIndex: 20,
        background: 'var(--paper)',
        border: '1px solid rgba(26,22,20,0.45)',
        padding: '4px 12px',
        fontFamily: 'var(--font-label)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        pointerEvents: 'none',
      }}
    >
      {formatYear(midYear)}
      {era && (
        <span style={{ opacity: 0.6, fontWeight: 400 }}>
          {' '}· {eraName(era, lang)}
        </span>
      )}
    </div>
  )
}
