import { useAppStore } from '../store/app'

/** EN | 中文 switch, top-right, styled like the other floating chrome. */
export function LangToggle() {
  const lang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)

  const seg = (value: 'en' | 'zh', text: string) => (
    <button
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
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
      style={{
        position: 'absolute',
        top: 40,
        right: 14,
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
