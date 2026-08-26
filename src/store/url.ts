import type { LayoutResult, TimeScale, RegionId } from '../types'
import { isRegionId } from '../config/regions'
import { useAppStore } from './app'
import { useViewStore } from './view'
import { centerOnRect } from '../interact/camera'

/**
 * URL state: ?year=618&region=east-asia&id=tang-dynasty&zoom=2.4&cursor=1206
 * Every view is linkable; back button works via popstate. Camera writes are
 * debounced replaceState so panning doesn't spam history; selection changes
 * push one entry each.
 */

export function initUrlSync(layout: LayoutResult, scale: TimeScale): () => void {
  const rectOf = new Map(layout.rects.map((r) => [r.polityId, r]))
  let applying = false

  function apply(params: URLSearchParams) {
    applying = true
    const app = useAppStore.getState()
    const id = params.get('id')
    if (id && rectOf.has(id)) {
      app.select(id)
      centerOnRect(rectOf.get(id)!)
    } else {
      app.select(null)
      const year = Number(params.get('year'))
      const zoom = Number(params.get('zoom'))
      if (Number.isFinite(year) && year !== 0) {
        const view = useViewStore.getState()
        const k = Number.isFinite(zoom) && zoom > 0 ? zoom : view.camera.k
        const y = scale.yearToY(year)
        useViewStore.setState({
          camera: { k, tx: view.camera.tx, ty: view.viewport.height / 2 - y * k },
        })
      }
    }
    const regionsParam = params.get('region')
    if (regionsParam) {
      const regions = new Set<RegionId>(
        regionsParam.split(',').filter(isRegionId),
      )
      app.setFilters({ regions })
    }
    const cursor = Number(params.get('cursor'))
    app.setTimeCursor(Number.isFinite(cursor) && cursor !== 0 ? cursor : null)
    // Allow state writes again after this frame's subscriptions settle.
    setTimeout(() => {
      applying = false
    }, 0)
  }

  function serialize(): string {
    const { camera, viewport } = useViewStore.getState()
    const { selectedId, filters, timeCursor } = useAppStore.getState()
    const params = new URLSearchParams()
    const midYear = Math.round(
      scale.yToYear((viewport.height / 2 - camera.ty) / camera.k),
    )
    params.set('year', String(midYear))
    params.set('zoom', camera.k.toFixed(2))
    if (selectedId) params.set('id', selectedId)
    if (filters.regions.size > 0) {
      params.set('region', [...filters.regions].join(','))
    }
    if (timeCursor !== null) params.set('cursor', String(timeCursor))
    return `?${params.toString()}`
  }

  // Initial read.
  apply(new URLSearchParams(window.location.search))

  const onPop = () => apply(new URLSearchParams(window.location.search))
  window.addEventListener('popstate', onPop)

  // Selection changes push history; camera/filter changes replace, debounced.
  let debounce: ReturnType<typeof setTimeout> | undefined
  let lastSelected = useAppStore.getState().selectedId
  const unsubApp = useAppStore.subscribe((s) => {
    if (applying) return
    if (s.selectedId !== lastSelected) {
      lastSelected = s.selectedId
      history.pushState(null, '', serialize())
    } else {
      clearTimeout(debounce)
      debounce = setTimeout(() => history.replaceState(null, '', serialize()), 400)
    }
  })
  const unsubView = useViewStore.subscribe(() => {
    if (applying) return
    clearTimeout(debounce)
    debounce = setTimeout(() => history.replaceState(null, '', serialize()), 400)
  })

  return () => {
    window.removeEventListener('popstate', onPop)
    unsubApp()
    unsubView()
    clearTimeout(debounce)
  }
}
