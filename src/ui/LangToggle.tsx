import { useAppStore } from '../store/app'
import { useRightOffset } from './chrome'

/**
 * EN | 中文 switch, top-right. `compact` tucks it into the mobile
 * header instead of the desktop right rail, where it would otherwise
 * land on the region switcher.
 */
export function LangToggle({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const right = useRightOffset()

  const seg = (value: 'en' | 'zh', text: string) => (
    <button
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      data-tip={
        value === 'en'
          ? lang === 'en'
            ? 'English (current)'
            : 'Switch to English'
          : lang === 'zh'
            ? '中文（当前）'
            : '切换为中文'
      }
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
      className={compact ? undefined : 'chronos-shift'}
      style={{
        position: 'absolute',
        top: compact ? 10 : 40,
        right: compact ? 10 : right,
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
