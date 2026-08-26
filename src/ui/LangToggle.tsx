import { useAppStore } from '../store/app'
import { useRightOffset } from './chrome'

/** EN | 中文 switch, top-right, styled like the other floating chrome. */
export function LangToggle() {
  const lang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const right = useRightOffset()

  const seg = (value: 'en' | 'zh', text: string) => (
    <button
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      className={lang === value ? 'cbtn-dark' : 'cbtn'}
      style={{
        font: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '5px 10px',
        border: 'none',
        cursor: 'pointer',
        background: lang === value ? 'var(--ink)' : 'transparent',
        color: lang === value ? 'var(--paper)' : 'var(--ink)',
      }}
    >
      {text}
    </button>
  )

  return (
    <div
      className="chronos-shift"
      style={{
        position: 'absolute',
        top: 40,
        right,
        zIndex: 25,
        display: 'flex',
        border: '1px solid rgba(26,22,20,0.45)',
        background: 'var(--paper)',
        fontFamily: 'var(--font-label)',
      }}
    >
      {seg('en', 'EN')}
      {seg('zh', '中文')}
    </div>
  )
}
