import type { PositionedRect } from '../types'
import { useViewStore } from '../store/view'

/** Animate the camera to frame one rect with breathing room. */
export function centerOnRect(rect: PositionedRect): void {
  const { viewport, world } = useViewStore.getState()
  const pad = 2.5 // world -> viewport fill fraction reciprocal
  const k = Math.min(
    viewport.width / (rect.width * pad),
    viewport.height / (rect.height * pad),
    12,
  )
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const target = {
    k,
    tx: viewport.width / 2 - cx * k,
    ty: viewport.height / 2 - cy * k,
  }
  animateCameraTo(target, world)
}

function animateCameraTo(
  target: { k: number; tx: number; ty: number },
  _world: { width: number; height: number },
): void {
  const store = useViewStore.getState()
  const from = { ...store.camera }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    useViewStore.setState({ camera: target })
    return
  }
  const t0 = performance.now()
  const DURATION = 450
  const ease = (t: number) => 1 - (1 - t) ** 3
  const step = (now: number) => {
    const t = Math.min((now - t0) / DURATION, 1)
    const e = ease(t)
    useViewStore.setState({
      camera: {
        k: from.k + (target.k - from.k) * e,
        tx: from.tx + (target.tx - from.tx) * e,
        ty: from.ty + (target.ty - from.ty) * e,
      },
    })
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** Frame a year range (era jump): fit its vertical span with margin. */
export function centerOnYearRange(y0: number, y1: number): void {
  const { viewport, world, camera } = useViewStore.getState()
  const k = Math.min(Math.max(viewport.height / ((y1 - y0) * 1.15), camera.k), 8)
  const cy = (y0 + y1) / 2
  const target = {
    k,
    tx: viewport.width / 2 - (world.width / 2) * k,
    ty: viewport.height / 2 - cy * k,
  }
  animateCameraTo(target, world)
}

/** Jump the camera so the given world point is centred, keeping zoom. */
export function centerAtWorld(wx: number, wy: number): void {
  const { viewport, camera } = useViewStore.getState()
  useViewStore.getState().panBy(
    viewport.width / 2 - (wx * camera.k + camera.tx),
    viewport.height / 2 - (wy * camera.k + camera.ty),
  )
}

/** Smoothly zoom by `factor` about a screen point over ~200ms. */
export function smoothZoom(factor: number, sx: number, sy: number): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const { zoomAt } = useViewStore.getState()
  if (reduced) {
    zoomAt(factor, sx, sy)
    return
  }
  const steps = 9
  const per = factor ** (1 / steps)
  let i = 0
  const tick = () => {
    zoomAt(per, sx, sy)
    if (++i < steps) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
