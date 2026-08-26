import { useEffect, useState } from 'react'

/**
 * Navigation help. Auto-opens once for first-time visitors (dismissed
 * state kept in localStorage), afterwards lives behind the ? button.
 * Never blocks: click anywhere, Esc, or the ? key closes it.
 */

const TIPS: [string, string][] = [
  ['Scroll / drag', 'Pan around the poster'],
  ['⌘ or Ctrl + scroll · pinch', 'Zoom at the cursor'],
  ['Double-click a block', 'Zoom to that polity'],
  ['Click a block', 'Open its story, lineage and contemporaries'],
  ['⇧ Shift + click', 'Pin up to 4 polities to compare lifespans'],
  ['⌘K / Ctrl+K', 'Search any polity or capital'],
  ['T', 'Drop the time cursor: see everything alive in one year'],
  ['← → ↑ ↓ · + −', 'Pan and zoom with the keyboard'],
  ['0', 'Fit the whole poster'],
]

const SEEN_KEY = 'chronos-tips-seen'

export function TipsOverlay() {
  const [open, setOpen] = useState(false)

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
        style={{
          position: 'absolute',
          right: 14,
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
          style={{
            position: 'absolute',
            right: 14,
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
            How to explore · click to dismiss
          </div>
          {TIPS.map(([keys, what]) => (
            <div
              key={keys}
              style={{ display: 'flex', gap: 10, fontSize: 12.5, lineHeight: 1.75 }}
            >
              <span style={{ fontWeight: 700, minWidth: 118 }}>{keys}</span>
              <span style={{ opacity: 0.8 }}>{what}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
