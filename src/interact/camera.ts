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
