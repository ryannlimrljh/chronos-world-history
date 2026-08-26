import { useEffect, useMemo } from 'react'
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
import { DebugSvg } from './debug/DebugSvg'

const CONFIG: LayoutConfig = {
  scale: DEFAULT_SCALE,
  width: 1200,
  sliceYears: 25,
  gap: 0,
  nestInset: 3,
  minRectWidth: 8,
  anchorStrength: 0.85,
}

export function App() {
  // The Phase 1 debug view stays reachable at #debug for engine work.
  if (window.location.hash === '#debug') return <DebugSvg />
  return <Chronos />
}

function Chronos() {
  const polities = useMemo(() => loadPolities(), [])
  const polityMap = useMemo(
    () => new Map(polities.map((p) => [p.id, p])),
    [polities],
  )
  const result = useMemo(() => layout(polities, CONFIG), [polities])
  const setWorld = useViewStore((s) => s.setWorld)

  useEffect(() => {
    setWorld({ width: result.width, height: result.height })
  }, [result, setWorld])

  useEffect(() => initUrlSync(result, DEFAULT_SCALE), [result])

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
    </div>
  )
}
