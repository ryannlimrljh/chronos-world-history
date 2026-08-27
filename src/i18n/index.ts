import type { Era, Polity, PolityCategory, RegionId } from '../types'
import {
  CATEGORY_DESC_ZH,
  CATEGORY_ZH,
  ERA_ZH,
  EVENT_ZH,
  POLITY_ZH,
  REGION_ZH,
  UI_ZH,
} from './zh'
import type { EraId } from './types-helper'
import { BLURB_ZH } from './blurbs'

export type Lang = 'en' | 'zh'

/** Primary display name for a polity in the active language. */
export function polityName(p: Polity, lang: Lang): string {
  if (lang === 'zh') return POLITY_ZH[p.id] ?? p.name
  return p.name
}

/**
 * Secondary line under a label: in English mode the native-script name,
 * in Chinese mode the English name (mirroring the reference poster,
 * which sets Chinese large with English beneath).
 */
export function politySecondary(p: Polity, lang: Lang): string | undefined {
  if (lang === 'zh') return p.name
  return p.nameNative
}

/** The polity's description in the active language. */
export function polityBlurb(p: Polity, lang: Lang): string {
  return lang === 'zh' ? (BLURB_ZH[p.id] ?? p.blurb) : p.blurb
}

export function regionName(id: RegionId, lang: Lang, fallback: string): string {
  return lang === 'zh' ? (REGION_ZH[id] ?? fallback) : fallback
}

export function eraName(era: Era, lang: Lang): string {
  return lang === 'zh' ? (ERA_ZH[era.id as EraId] ?? era.name) : era.name
}

export function categoryName(c: PolityCategory, lang: Lang): string {
  return lang === 'zh' ? CATEGORY_ZH[c] : c
}

const CATEGORY_DESC_EN: Record<PolityCategory, string> = {
  empire: 'A state ruled by an emperor, usually spanning many peoples',
  kingdom: 'A state under a hereditary monarch',
  dynasty: "A ruling family's era, used mainly for China and Egypt",
  republic: 'Rule without a monarch, by citizens or councils',
  caliphate: 'An Islamic state under a caliph',
  khanate: 'A steppe polity under a khan',
  confederation: 'An alliance of tribes, cities or states',
  'city-state': 'An independent city and its hinterland',
  colonial: 'Territory ruled by a foreign power',
  'modern-state': 'A contemporary nation-state',
}

export function categoryDescription(c: PolityCategory, lang: Lang): string {
  return lang === 'zh' ? CATEGORY_DESC_ZH[c] : CATEGORY_DESC_EN[c]
}

export function eventTitle(id: string, fallback: string, lang: Lang): string {
  return lang === 'zh' ? (EVENT_ZH[id] ?? fallback) : fallback
}

/** UI chrome strings. English is authored inline at call sites. */
export function ui(key: string, en: string, lang: Lang): string {
  return lang === 'zh' ? (UI_ZH[key] ?? en) : en
}

/** CJK glyphs are full-width; Latin in Barlow Condensed runs ~0.52em. */
export function textWidthEm(text: string): number {
  let em = 0
  for (const ch of text) {
    em += /[⺀-鿿가-힯　-ヿ＀-￯]/.test(ch)
      ? 1.05
      : 0.52
  }
  return em
}
