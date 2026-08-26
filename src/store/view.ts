import { create } from 'zustand'

/**
 * The view store: one shared source of truth for where the camera is.
 *
 * World space is the layout engine's pixel space (x across the mosaic,
 * y down the timeline). The camera maps world to screen:
 *
 *   screen = world * k + t
 *
 * where k is the zoom factor and (tx, ty) the screen-space translation.
 * Explore, Tour and every overlay read and write this same store, which is
 * what keeps Tour "a driver, not a second app".
 */

export interface Camera {
  k: number
  tx: number
  ty: number
}

interface Bounds {
  width: number
  height: number
}

interface ViewState {
  camera: Camera
  /** World-space size of the laid-out mosaic, set once after layout. */
  world: Bounds
  /** Screen-space size of the viewport, kept fresh by a resize observer. */
  viewport: Bounds
  setWorld(world: Bounds): void
  setViewport(viewport: Bounds): void
  panBy(dx: number, dy: number): void
  /** Zoom by factor `f` keeping the screen point (sx, sy) fixed. */
  zoomAt(f: number, sx: number, sy: number): void
  /** Fit the whole mosaic in the viewport with a margin. */
  fitAll(): void
}

const MAX_ZOOM = 40

function minZoom(world: Bounds, viewport: Bounds): number {
  if (world.width === 0 || world.height === 0) return 0.05
  return Math.min(
    (viewport.width / world.width) * 0.9,
    (viewport.height / world.height) * 0.9,
    1,
  )
}

/** Keep at least a third of the mosaic on screen in each axis. */
function clampCamera(cam: Camera, world: Bounds, viewport: Bounds): Camera {
  const k = Math.min(Math.max(cam.k, minZoom(world, viewport)), MAX_ZOOM)
  const worldW = world.width * k
  const worldH = world.height * k
  const marginX = Math.min(viewport.width * 0.66, worldW)
  const marginY = Math.min(viewport.height * 0.66, worldH)
  const tx = Math.min(
    Math.max(cam.tx, viewport.width - worldW - marginX),
    marginX,
  )
  const ty = Math.min(
    Math.max(cam.ty, viewport.height - worldH - marginY),
    marginY,
  )
  return { k, tx, ty }
}

export const useViewStore = create<ViewState>((set, get) => ({
  camera: { k: 1, tx: 0, ty: 0 },
  world: { width: 1, height: 1 },
  viewport: { width: 1, height: 1 },

  setWorld(world) {
    set({ world })
    get().fitAll()
  },

  setViewport(viewport) {
    const { camera, world } = get()
    set({ viewport, camera: clampCamera(camera, world, viewport) })
  },

  panBy(dx, dy) {
    const { camera, world, viewport } = get()
    set({
      camera: clampCamera(
        { ...camera, tx: camera.tx + dx, ty: camera.ty + dy },
        world,
        viewport,
      ),
    })
  },

  zoomAt(f, sx, sy) {
    const { camera, world, viewport } = get()
    const k = Math.min(
      Math.max(camera.k * f, minZoom(world, viewport)),
      MAX_ZOOM,
    )
    const scale = k / camera.k
    // Keep the world point under the cursor stationary on screen.
    const tx = sx - (sx - camera.tx) * scale
    const ty = sy - (sy - camera.ty) * scale
    set({ camera: clampCamera({ k, tx, ty }, world, viewport) })
  },

  fitAll() {
    const { world, viewport } = get()
    const k = minZoom(world, viewport)
    const tx = (viewport.width - world.width * k) / 2
    const ty = (viewport.height - world.height * k) / 2
    set({ camera: { k, tx, ty } })
  },
}))
