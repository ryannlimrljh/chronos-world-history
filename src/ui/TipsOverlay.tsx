import { useEffect, useState } from 'react'
import { useAppStore } from '../store/app'
import { ui } from '../i18n'
import { useRightOffset } from './chrome'

/**
 * Navigation help. Auto-opens once for first-time visitors (dismissed
 * state kept in localStorage), afterwards lives behind the ? button.
 * Never blocks: click anywhere, Esc, or the ? key closes it.
 */

const COARSE =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches

/** Touch users get touch instructions, not keyboard shortcuts. */
const TIP_KEYS: [string, string, string][] = COARSE
  ? [
      ['tipTouchPan', 'Drag', 'Move around the poster'],
      ['tipTouchZoom', 'Pinch with two fingers', 'Zoom in and out'],
      ['tipTouchTap', 'Tap a block', 'Open its story, lineage and contemporaries'],
      ['tipTouchDbl', 'Double-tap a block', 'Zoom to that polity'],
      ['tipTouchHold', 'Press and hold a block', 'Pin up to 4 polities to compare lifespans'],
      ['tipTouchTools', 'Buttons on the right', 'Search, zoom, fit the poster, time cursor'],
      ['tipTouchMap', 'Small map, bottom right', 'Shows where you are; tap it to jump'],
    ]
  : [
      ['tipPan', 'Scroll / drag', 'Pan around the poster'],
      ['tipZoom', '⌘ or Ctrl + scroll · pinch', 'Zoom at the cursor'],
      ['tipDbl', 'Double-click a block', 'Zoom to that polity'],
      ['tipClick', 'Click a block', 'Open its story, lineage and contemporaries'],
      ['tipShift', '⇧ Shift + click', 'Pin up to 4 polities to compare lifespans'],
      ['tipSearch', '⌘K / Ctrl+K', 'Search any polity or capital'],
      ['tipCursor', 'T', 'Drop the time cursor: see everything alive in one year'],
      ['tipKeys', '← → ↑ ↓ · + −', 'Pan and zoom with the keyboard'],
      ['tipFit', '0', 'Fit the whole poster'],
    ]

const SEEN_KEY = 'chronos-tips-seen'

export function TipsOverlay() {
  const [open, setOpen] = useState(false)
  const lang = useAppStore((s) => s.lang)
  const right = useRightOffset()

  useEffect(() => {
    let seen = true
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1'
    } catch {
      /* storage unavailable: skip auto-open */
    }
    if (!seen) setOpen(true)
  }, [])

  const dismiss = () => {
    setOpen(false)
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* fine */
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '?') setOpen((o) => !o)
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button
        onClick={() => (open ? dismiss() : setOpen(true))}
        aria-label="Navigation tips"
        data-tip={`${ui('helpTip', 'Help: how to explore', lang)} · ?`}
        className="cbtn chronos-shift"
        style={{
          position: 'absolute',
          right,
          bottom: 14,
          zIndex: 30,
          width: 30,
          height: 30,
          border: '1px solid rgba(26,22,20,0.45)',
          background: 'var(--paper)',
          fontFamily: 'var(--font-label)',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          color: 'var(--ink)',
        }}
      >
        ?
      </button>
      {open && (
        <div
          onClick={dismiss}
          className="chronos-pop chronos-shift"
          style={{
            position: 'absolute',
            right,
            bottom: 52,
            zIndex: 30,
            width: 300,
            background: 'var(--paper)',
            border: '1px solid rgba(26,22,20,0.5)',
            padding: '12px 14px',
            fontFamily: 'var(--font-label)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              opacity: 0.55,
              marginBottom: 8,
            }}
          >
            {ui('howToExplore', 'How to explore · click to dismiss', lang)}
          </div>
          {TIP_KEYS.map(([key, keysEn, whatEn]) => (
            <div
              key={key}
              style={{ display: 'flex', gap: 10, fontSize: 12.5, lineHeight: 1.75 }}
            >
              <span style={{ fontWeight: 700, minWidth: 118 }}>
                {ui(key, keysEn, lang)}
              </span>
              <span style={{ opacity: 0.8 }}>{ui(`${key}What`, whatEn, lang)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
