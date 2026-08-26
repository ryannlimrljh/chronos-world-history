import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useViewStore } from '../store/view'

/**
 * Owns every pointer, wheel and keyboard interaction on the mosaic.
 *
 * Conventions (the Figma/maps posture):
 *   wheel            -> pan (trackpads pan both axes)
 *   ctrl/cmd + wheel -> zoom at cursor (browsers deliver pinch this way)
 *   drag             -> pan
 *   arrows           -> pan; + / - -> zoom; 0 -> fit everything
 */
export function Viewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const { setViewport, panBy, zoomAt, fitAll } = useViewStore.getState()

    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      setViewport({ width: rect.width, height: rect.height })
    })
    observer.observe(el)

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.01)
        zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top)
      } else {
        panBy(-e.deltaX, -e.deltaY)
      }
    }

    let dragging = false
    let lastX = 0
    let lastY = 0
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      panBy(e.clientX - lastX, e.clientY - lastY)
      lastX = e.clientX
      lastY = e.clientY
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      el.releasePointerCapture(e.pointerId)
      el.style.cursor = 'grab'
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const pan = 80
      const rect = el.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      switch (e.key) {
        case 'ArrowUp': panBy(0, pan); break
        case 'ArrowDown': panBy(0, -pan); break
        case 'ArrowLeft': panBy(pan, 0); break
        case 'ArrowRight': panBy(-pan, 0); break
        case '+': case '=': zoomAt(1.25, cx, cy); break
        case '-': case '_': zoomAt(0.8, cx, cy); break
        case '0': fitAll(); break
        default: return
      }
      e.preventDefault()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('keydown', onKeyDown)
    return () => {
      observer.disconnect()
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label="World history mosaic. Arrow keys pan, plus and minus zoom, zero fits all."
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: 'grab',
        outline: 'none',
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  )
}
