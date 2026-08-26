import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { LayoutResult } from '../types'
import { useViewStore } from '../store/view'
import { useAppStore } from '../store/app'
import { buildHitIndex } from '../interact/hit'
import { centerOnRect } from '../interact/camera'

/**
 * Owns every pointer, wheel and keyboard interaction on the mosaic.
 *
 * Conventions (the Figma/maps posture):
 *   wheel            -> pan (trackpads pan both axes)
 *   ctrl/cmd + wheel -> zoom at cursor (browsers deliver pinch this way)
 *   drag             -> pan; plain click -> select; shift+click -> compare
 *   double-click     -> zoom to fit that polity
 *   arrows           -> pan; + / - -> zoom; 0 -> fit; Esc -> close/clear
 */
export function Viewport({
  layout,
  children,
}: {
  layout: LayoutResult
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const { setViewport, panBy, zoomAt, fitAll } = useViewStore.getState()
    const hit = buildHitIndex(layout)

    const toWorld = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      const { camera } = useViewStore.getState()
      return {
        x: (clientX - rect.left - camera.tx) / camera.k,
        y: (clientY - rect.top - camera.ty) / camera.k,
        sx: clientX - rect.left,
        sy: clientY - rect.top,
      }
    }

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
    let moved = false
    let lastX = 0
    let lastY = 0
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging = true
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          moved = true
          el.style.cursor = 'grabbing'
        }
        panBy(dx, dy)
        lastX = e.clientX
        lastY = e.clientY
        return
      }
      const { x, y } = toWorld(e.clientX, e.clientY)
      const found = hit.test(x, y)
      const { hoveredId, setHovered } = useAppStore.getState()
      const id = found?.polityId ?? null
      if (id !== hoveredId) setHovered(id)
      el.style.cursor = id ? 'pointer' : 'grab'
    }
    const onPointerUp = (e: PointerEvent) => {
      const wasDrag = moved
      dragging = false
      el.releasePointerCapture(e.pointerId)
      el.style.cursor = 'grab'
      if (wasDrag) return
      // A clean click: select, or shift-click to toggle compare.
      const { x, y } = toWorld(e.clientX, e.clientY)
      const found = hit.test(x, y)
      const app = useAppStore.getState()
      if (!found) {
        app.select(null)
        return
      }
      if (e.shiftKey) app.toggleCompare(found.polityId)
      else app.select(found.polityId)
    }
    const onPointerLeave = () => useAppStore.getState().setHovered(null)
    const onDblClick = (e: MouseEvent) => {
      const { x, y } = toWorld(e.clientX, e.clientY)
      const found = hit.test(x, y)
      if (found) centerOnRect(found)
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
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('dblclick', onDblClick)
    el.addEventListener('keydown', onKeyDown)
    return () => {
      observer.disconnect()
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('dblclick', onDblClick)
      el.removeEventListener('keydown', onKeyDown)
    }
  }, [layout])

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
