import { useEffect, useMemo, useState } from 'react'
import type { LayoutConfig } from './types'
import { layout } from './layout/engine'
import { DEFAULT_SCALE } from './layout/scale'
import { loadPolities } from './data/polities'
import { useViewStore } from './store/view'
import { initUrlSync } from './store/url'
import { Viewport } from './render/Viewport'
import { CanvasMosaic } from './render/CanvasMosaic'
import { LabelLayer } from './render/LabelLayer'
import { TimeAxis, AXIS_WIDTH } from './render/TimeAxis'
import { RegionHeader, HEADER_HEIGHT } from './render/RegionHeader'
import { Tooltip } from './ui/Tooltip'
import { Drawer } from './ui/Drawer'
import { SearchPalette } from './ui/SearchPalette'
import { FilterBar } from './ui/FilterBar'
import { TimeCursor } from './ui/TimeCursor'
import { CompareBar } from './ui/CompareBar'
import { PulseOverlay } from './ui/PulseOverlay'
import { PosterChrome } from './render/PosterChrome'
import { TipsOverlay } from './ui/TipsOverlay'
import { LangToggle } from './ui/LangToggle'
import { Minimap } from './ui/Minimap'
import { Toolbar } from './ui/Toolbar'
import { PositionReadout } from './ui/PositionReadout'
import { HoverTip } from './ui/HoverTip'
import { TourPanel } from './ui/TourPanel'
import { MobileLanes } from './ui/MobileLanes'
import { DebugSvg } from './debug/DebugSvg'
import { useAppStore } from './store/app'

// Dev-only: expose stores for debugging in the browser console.
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__stores = {
    view: useViewStore,
    app: useAppStore,
  }
}

// width + titleReserve tuned so the finished sheet lands on A-series
// portrait proportions (~1:1.4 against the 1762px-tall scale).
/** Tracks the small-screen breakpoint, re-evaluated on resize. */
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 900,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

const CONFIG: LayoutConfig = {
  scale: DEFAULT_SCALE,
  width: 1250,
  sliceYears: 25,
  gap: 0,
  nestInset: 3,
  minRectWidth: 6,
  anchorStrength: 0.85,
  titleReserve: { untilYear: -950, width: 340 },
}

export function App() {
  // The Phase 1 debug view stays reachable at #debug for engine work.
  if (window.location.hash === '#debug') return <DebugSvg />
  return <Chronos />
}

function Chronos() {
  const narrow = useIsNarrow()
  const polities = useMemo(() => loadPolities(), [])
  const polityMap = useMemo(
    () => new Map(polities.map((p) => [p.id, p])),
    [polities],
  )
  const result = useMemo(() => layout(polities, CONFIG), [polities])
  const setWorld = useViewStore((s) => s.setWorld)

  useEffect(() => {
    // Extra height covers the flag row, legend and footnote strip.
    setWorld({ width: result.width, height: result.height + 70 })
  }, [result, setWorld])

  useEffect(() => initUrlSync(result, DEFAULT_SCALE), [result])

  // Below 900px the mosaic's horizontal comparison cannot be shown
  // honestly, so the same data is read as a per-region chronology.
  if (narrow) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <MobileLanes polities={polityMap} />
        <Drawer layout={result} polities={polityMap} />
        <LangToggle compact />
        <SearchPalette layout={result} polities={polityMap} />
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: HEADER_HEIGHT,
          left: AXIS_WIDTH,
          right: 0,
          bottom: 0,
        }}
      >
        <Viewport layout={result}>
          <CanvasMosaic layout={result} polities={polityMap} />
          <PosterChrome layout={result} polities={polityMap} />
          <LabelLayer layout={result} polities={polityMap} />
          <PulseOverlay layout={result} />
          <TimeCursor scale={DEFAULT_SCALE} polities={polityMap} />
        </Viewport>
      </div>
      <TimeAxis scale={DEFAULT_SCALE} />
      <RegionHeader layout={result} />
      <FilterBar />
      <Tooltip layout={result} polities={polityMap} />
      <Drawer layout={result} polities={polityMap} />
      <CompareBar polities={polityMap} />
      <SearchPalette layout={result} polities={polityMap} />
      <TipsOverlay />
      <LangToggle />
      <Toolbar layout={result} polities={polityMap} scale={DEFAULT_SCALE} />
      <Minimap layout={result} />
      <PositionReadout />
      <TourPanel layout={result} scale={DEFAULT_SCALE} />
      <HoverTip />
    </div>
  )
}
