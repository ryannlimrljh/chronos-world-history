import { useEffect, useRef } from 'react'
import type { LayoutResult, TimeScale } from '../types'
import { CHAPTERS } from '../../data/chapters'
import { useAppStore } from '../store/app'
import { useViewStore } from '../store/view'
import { goToChapter } from '../interact/camera'
import { ui } from '../i18n'

/**
 * Tour mode: authored chapters that drive the camera and the spotlight.
 * A driver over Explore's renderer and store, never a second app.
 *
 * Scroll the panel and the chapter changes; arrows and the buttons do the
 * same thing for keyboard and touch. Chapter changes cut instantly under
 * prefers-reduced-motion, because the camera tween honours it.
 */
export function TourPanel({
  layout,
  scale,
}: {
  layout: LayoutResult
  scale: TimeScale
}) {
  const index = useAppStore((s) => s.tourChapter)
  const setTourChapter = useAppStore((s) => s.setTourChapter)
  const endTour = useAppStore((s) => s.endTour)
  const lang = useAppStore((s) => s.lang)
  const scrollRef = useRef<HTMLDivElement>(null)
  const active = index !== null

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), CHAPTERS.length - 1)
    const chapter = CHAPTERS[clamped]!
    setTourChapter(clamped, chapter.highlight)
    goToChapter(chapter, layout, scale)
  }

  // Frame the current chapter. Deferred a frame so any pending fit or
  // resize settles first, and repeated on resize so the framing survives
  // a window change mid-tour.
  useEffect(() => {
    if (index === null) return
    const chapter = CHAPTERS[index]!
    setTourChapter(index, chapter.highlight)
    const frame = () => goToChapter(chapter, layout, scale)
    // The viewport starts at 1x1 until the resize observer reports real
    // dimensions. Framing before that yields a microscopic zoom, so wait
    // for a usable viewport rather than assuming one frame is enough.
    let unsub: (() => void) | undefined
    if (useViewStore.getState().viewport.width > 50) {
      frame()
    } else {
      unsub = useViewStore.subscribe((s) => {
        if (s.viewport.width > 50) {
          unsub?.()
          unsub = undefined
          frame()
        }
      })
    }
    let debounce: ReturnType<typeof setTimeout> | undefined
    const onResize = () => {
      clearTimeout(debounce)
      debounce = setTimeout(frame, 180)
    }
    window.addEventListener('resize', onResize)
    return () => {
      unsub?.()
      clearTimeout(debounce)
      window.removeEventListener('resize', onResize)
    }
  }, [index, layout, scale, setTourChapter])

  // Keyboard: arrows move between chapters, Escape leaves the tour.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape') endTour()
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        go(index! + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        go(index! - 1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  if (!active) return null
  const chapter = CHAPTERS[index]!
  const title = lang === 'zh' ? chapter.titleZh : chapter.title
  const narration = lang === 'zh' ? chapter.narrationZh : chapter.narration

  // Scroll inside the panel advances chapters, the scrollytelling
  // convention, with a cooldown so one gesture moves one chapter.
  let cooling = false
  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    if (cooling || Math.abs(e.deltaY) < 8) return
    cooling = true
    setTimeout(() => {
      cooling = false
    }, 420)
    go(index + (e.deltaY > 0 ? 1 : -1))
  }

  const navBtn = (label: string, to: number, disabled: boolean) => (
    <button
      onClick={() => go(to)}
      disabled={disabled}
      className="cbtn"
      style={{
        font: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '7px 14px',
        border: '1px solid rgba(26,22,20,0.45)',
        background: 'transparent',
        color: 'var(--ink)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      {label}
    </button>
  )

  return (
    <aside
      ref={scrollRef}
      onWheel={onWheel}
      aria-label={ui('tour', 'Guided tour', lang)}
      className="chronos-pop"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'min(380px, 92vw)',
        background: 'var(--paper)',
        borderRight: '1px solid rgba(26,22,20,0.35)',
        padding: '20px 22px 18px',
        zIndex: 30,
        fontFamily: 'var(--font-label)',
        display: 'flex',
        flexDirection: 'column',
        overscrollBehavior: 'contain',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.55 }}>
          {ui('tour', 'Guided tour', lang)}
        </span>
        <button
          onClick={endTour}
          className="cbtn"
          style={{ font: 'inherit', fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', opacity: 0.65 }}
        >
          {ui('exitTour', 'Exit', lang)} ✕
        </button>
      </div>

      {/* Chapter position as a row of rules: structure, not decoration. */}
      <div style={{ display: 'flex', gap: 4, margin: '14px 0 16px' }}>
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => go(i)}
            aria-label={lang === 'zh' ? c.titleZh : c.title}
            data-tip={lang === 'zh' ? c.titleZh : c.title}
            style={{
              flex: 1,
              height: 3,
              padding: 0,
              border: 'none',
              cursor: 'pointer',
              background: i <= index ? 'var(--ink)' : 'rgba(26,22,20,0.18)',
              transition: 'background-color 0.2s ease-out',
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
        {index + 1} / {CHAPTERS.length}
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 26,
          lineHeight: 1.08,
          margin: 0,
          textWrap: 'balance',
        }}
      >
        {title}
      </h2>
      <p
        key={chapter.id}
        className="chronos-pop"
        style={{
          fontSize: 14.5,
          lineHeight: lang === 'zh' ? 1.85 : 1.6,
          marginTop: 14,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {narration}
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {navBtn(ui('prev', 'Back', lang), index - 1, index === 0)}
        {navBtn(
          index === CHAPTERS.length - 1
            ? ui('exploreNow', 'Explore', lang)
            : ui('next', 'Next', lang),
          index + 1,
          false,
        )}
        <span style={{ fontSize: 10.5, opacity: 0.45, alignSelf: 'center', marginLeft: 'auto' }}>
          {ui('tourHint', 'scroll or ↑ ↓', lang)}
        </span>
      </div>
    </aside>
  )
}
