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
    // Touch: active pointers for pinch, and a long-press timer that makes
    // press-and-hold the touch equivalent of shift-click compare.
    const pointers = new Map<number, { x: number; y: number }>()
    let pinchDist = 0
    let pinchMidX = 0
    let pinchMidY = 0
    let longPress: ReturnType<typeof setTimeout> | undefined
    let longPressFired = false

    const clearLongPress = () => {
      if (longPress) clearTimeout(longPress)
      longPress = undefined
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)
      longPressFired = false
      if (pointers.size === 2) {
        // Second finger down: this is a pinch, not a pan or press.
        dragging = false
        clearLongPress()
        const [a, b] = [...pointers.values()]
        pinchDist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
        pinchMidX = (a!.x + b!.x) / 2
        pinchMidY = (a!.y + b!.y) / 2
        return
      }
      dragging = true
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      if (e.pointerType === 'touch') {
        const { x, y } = toWorld(e.clientX, e.clientY)
        longPress = setTimeout(() => {
          if (moved || pointers.size !== 1) return
          const found = hit.test(x, y)
          if (found) {
            longPressFired = true
            useAppStore.getState().toggleCompare(found.polityId)
            if (navigator.vibrate) navigator.vibrate(12)
          }
        }, 520)
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
      if (pointers.size === 2) {
        // Pinch: zoom about the midpoint, pan with its drift.
        const rect = el.getBoundingClientRect()
        const [a, b] = [...pointers.values()]
        const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
        const midX = (a!.x + b!.x) / 2
        const midY = (a!.y + b!.y) / 2
        if (pinchDist > 0 && dist > 0) {
          zoomAt(dist / pinchDist, midX - rect.left, midY - rect.top)
          panBy(midX - pinchMidX, midY - pinchMidY)
        }
        pinchDist = dist
        pinchMidX = midX
        pinchMidY = midY
        return
      }
      if (dragging) {
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        if (Math.abs(dx) + Math.abs(dy) > 4) {
          moved = true
          clearLongPress()
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
      pointers.delete(e.pointerId)
      clearLongPress()
      if (pointers.size > 0) return // other finger still down (pinch end)
      const wasDrag = moved
      dragging = false
      el.releasePointerCapture(e.pointerId)
      el.style.cursor = 'grab'
      if (wasDrag || longPressFired) return
      // A clean click or tap: select, or shift-click to toggle compare.
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
    const onPointerCancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      clearLongPress()
      dragging = false
    }
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
    el.addEventListener('pointercancel', onPointerCancel)
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('dblclick', onDblClick)
    el.addEventListener('keydown', onKeyDown)
    return () => {
      observer.disconnect()
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('dblclick', onDblClick)
      el.removeEventListener('keydown', onKeyDown)
    }
  }, [layout])

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="mosaic-surface"
      aria-label="World history mosaic. Arrow keys pan, plus and minus zoom, zero fits all."
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  )
}
