import { useEffect, useMemo } from 'react'
import type { LayoutConfig } from './types'
import { layout } from './layout/engine'
import { DEFAULT_SCALE } from './layout/scale'
import { loadFixture } from './data/fixture'
import { useViewStore } from './store/view'
import { Viewport } from './render/Viewport'
import { CanvasMosaic } from './render/CanvasMosaic'
import { LabelLayer } from './render/LabelLayer'
import { TimeAxis, AXIS_WIDTH } from './render/TimeAxis'
import { RegionHeader, HEADER_HEIGHT } from './render/RegionHeader'
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
  const polities = useMemo(() => loadFixture(), [])
  const polityMap = useMemo(
    () => new Map(polities.map((p) => [p.id, p])),
    [polities],
  )
  const result = useMemo(() => layout(polities, CONFIG), [polities])
  const setWorld = useViewStore((s) => s.setWorld)

  useEffect(() => {
    setWorld({ width: result.width, height: result.height })
  }, [result, setWorld])

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
        <Viewport>
          <CanvasMosaic layout={result} />
          <LabelLayer layout={result} polities={polityMap} />
        </Viewport>
      </div>
      <TimeAxis scale={DEFAULT_SCALE} />
      <RegionHeader layout={result} />
    </div>
  )
}
