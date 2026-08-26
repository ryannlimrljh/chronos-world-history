import { useEffect, useState } from 'react'

/**
 * The app's own tooltip layer. Any element with a `data-tip` attribute
 * gets a styled tip after a short hover (or keyboard focus) — fast,
 * consistent, immune to host-viewer quirks and overflow clipping, unlike
 * native `title` tooltips. Renders in a fixed layer above everything.
 */

interface TipState {
  text: string
  x: number
  y: number
  /** Which side of the element the tip sits on. */
  side: 'left' | 'below'
}

export function HoverTip() {
  const [tip, setTip] = useState<TipState | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let currentEl: HTMLElement | null = null

    const show = (el: HTMLElement) => {
      const text = el.getAttribute('data-tip')
      if (!text) return
      const r = el.getBoundingClientRect()
      // Rail controls sit at the right edge: put the tip to their left.
      // Everything else gets the tip below, clamped to the viewport.
      if (window.innerWidth - r.right < 80 && r.left > 280) {
        setTip({ text, x: r.left - 8, y: r.top + r.height / 2, side: 'left' })
      } else {
        setTip({
          text,
          x: Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130),
          y: Math.min(r.bottom + 8, window.innerHeight - 60),
          side: 'below',
        })
      }
    }

    const onOver = (e: Event) => {
      const el =
        (e.target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null
      if (el === currentEl) return
      currentEl = el
      clearTimeout(timer)
      if (!el) {
        setTip(null)
        return
      }
      timer = setTimeout(() => show(el), 180)
    }
    const hide = () => {
      clearTimeout(timer)
      currentEl = null
      setTip(null)
    }

    document.addEventListener('mouseover', onOver)
    document.addEventListener('focusin', onOver)
    document.addEventListener('mousedown', hide, true)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('blur', hide)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('focusin', onOver)
      document.removeEventListener('mousedown', hide, true)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('blur', hide)
    }
  }, [])

  if (!tip) return null
  return (
    <div
      className="chronos-pop"
      style={{
        position: 'fixed',
        left: tip.x,
        top: tip.y,
        transform:
          tip.side === 'left' ? 'translate(-100%, -50%)' : 'translate(-50%, 0)',
        maxWidth: 240,
        background: 'var(--ink)',
        color: 'var(--paper)',
        fontFamily: 'var(--font-label)',
        fontSize: 12.5,
        fontWeight: 500,
        lineHeight: 1.4,
        padding: '5px 10px',
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      {tip.text}
    </div>
  )
}
