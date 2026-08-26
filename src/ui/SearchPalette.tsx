import { useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutResult, Polity } from '../types'
import { useAppStore } from '../store/app'
import { centerOnRect } from '../interact/camera'
import { formatRange } from '../interact/format'
import { search } from '../interact/fuzzy'
import type { SearchDoc } from '../interact/fuzzy'
import { polityName, politySecondary, ui } from '../i18n'
import { POLITY_ZH } from '../i18n/zh'

/**
 * The ⌘K command palette. Fuzzy over name, native name, aliases and
 * capital. Enter (or click) zooms to the match and pulses it.
 */
export function SearchPalette({
  layout,
  polities,
}: {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
}) {
  const open = useAppStore((s) => s.searchOpen)
  const setOpen = useAppStore((s) => s.setSearchOpen)
  const select = useAppStore((s) => s.select)
  const setPulse = useAppStore((s) => s.setPulse)
  const lang = useAppStore((s) => s.lang)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const docs = useMemo<SearchDoc[]>(
    () =>
      [...polities.values()].map((p) => ({
        id: p.id,
        haystacks: [
          p.name,
          ...(POLITY_ZH[p.id] ? [POLITY_ZH[p.id]!] : []),
          ...(p.nameNative ? [p.nameNative] : []),
          ...(p.aka ?? []),
          ...(p.capital ? [p.capital] : []),
        ],
      })),
    [polities],
  )
  const rectOf = useMemo(
    () => new Map(layout.rects.map((r) => [r.polityId, r])),
    [layout],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useAppStore.getState().searchOpen)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(() => search(query, docs, 9), [query, docs])

  if (!open) return null

  const go = (id: string) => {
    setOpen(false)
    select(id)
    const rect = rectOf.get(id)
    if (rect) {
      centerOnRect(rect)
      setPulse(id)
    }
  }

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '18vh',
        background: 'rgba(26,22,20,0.14)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="chronos-pop"
        style={{
          width: 'min(480px, 92vw)',
          background: 'var(--paper)',
          border: '1px solid rgba(26,22,20,0.5)',
          fontFamily: 'var(--font-label)',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && results[active]) {
              go(results[active])
            }
          }}
          placeholder={ui('searchPlaceholder', 'Search polities, capitals…', lang)}
          aria-label="Search"
          style={{
            width: '100%',
            font: 'inherit',
            fontSize: 16,
            padding: '12px 14px',
            border: 'none',
            borderBottom: results.length ? '1px solid rgba(26,22,20,0.25)' : 'none',
            background: 'transparent',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {results.map((id, i) => {
          const p = polities.get(id)!
          return (
            <div
              key={id}
              onClick={() => go(id)}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: '7px 14px',
                cursor: 'pointer',
                background: i === active ? 'rgba(26,22,20,0.08)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {polityName(p, lang)}
                {politySecondary(p, lang) && (
                  <span style={{ fontWeight: 400, opacity: 0.65 }}>
                    {' '}{politySecondary(p, lang)}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 12, opacity: 0.6, whiteSpace: 'nowrap' }}>
                {formatRange(p)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
