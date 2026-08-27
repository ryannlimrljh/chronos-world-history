import type { LayoutResult, Polity, TimeScale } from '../types'
import { ERAS } from '../config/eras'
import { REGIONS } from '../config/regions'
import { labelColorOn, PAPER, INK } from '../config/color'
import { styleFor } from '../render/paint'
import { isDimmed } from '../interact/dim'
import type { FilterState } from '../store/app'
import type { Lang } from '../i18n'
import { eraName, polityName, regionName, textWidthEm, ui } from '../i18n'

/**
 * Print export. Renders the whole poster as vector SVG at A1
 * (594 x 841 mm), labels included, no interactive chrome. Respects the
 * active language and filters, because what you export should be what
 * you were looking at.
 */

const MM = 3.7795275591 // px per mm at 96dpi
const A1_W = 594 * MM
const A1_H = 841 * MM
const MARGIN = 22 * MM
const AXIS_W = 26 * MM

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export interface ExportOptions {
  layout: LayoutResult
  polities: ReadonlyMap<string, Polity>
  scale: TimeScale
  filters: FilterState
  lang: Lang
}

export function buildPosterSvg({
  layout,
  polities,
  scale,
  filters,
  lang,
}: ExportOptions): string {
  const bodyW = A1_W - MARGIN * 2 - AXIS_W
  const bodyH = A1_H - MARGIN * 2 - 34 * MM
  const k = Math.min(bodyW / layout.width, bodyH / layout.height)
  // Centre the mosaic in the available width; height usually binds, so
  // without this the sheet is left-heavy with dead paper on the right.
  const ox = MARGIN + AXIS_W + (bodyW - layout.width * k) / 2
  const oy = MARGIN + 30 * MM

  const out: string[] = []
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="594mm" height="841mm" ` +
      `viewBox="0 0 ${A1_W.toFixed(1)} ${A1_H.toFixed(1)}">`,
  )
  out.push(
    `<rect width="${A1_W.toFixed(1)}" height="${A1_H.toFixed(1)}" fill="${PAPER}"/>`,
  )
  out.push(
    `<style>text{font-family:'Barlow Condensed','Noto Sans SC',sans-serif;` +
      `fill:${INK};font-variant-numeric:tabular-nums}` +
      `.d{font-family:Archivo,sans-serif;font-weight:900}</style>`,
  )

  out.push(
    `<text class="d" x="${MARGIN}" y="${MARGIN + 16 * MM}" font-size="${13 * MM}">WORLD</text>`,
    `<text class="d" x="${MARGIN}" y="${MARGIN + 28 * MM}" font-size="${13 * MM}">HISTORY</text>`,
    `<text x="${MARGIN}" y="${MARGIN + 34 * MM}" font-size="${3.4 * MM}" letter-spacing="1.4">` +
      `${esc(ui('subtitle', '5000-Year Interactive Timeline', lang))}</text>`,
  )

  for (const era of ERAS) {
    const y0 = oy + scale.yearToY(era.start) * k
    const y1 = oy + scale.yearToY(era.end) * k
    out.push(
      `<line x1="${MARGIN}" y1="${y0.toFixed(1)}" x2="${MARGIN}" y2="${y1.toFixed(1)}" stroke="${INK}" stroke-opacity="0.4"/>`,
    )
    if (y1 - y0 > 12 * MM) {
      const cy = (y0 + y1) / 2
      const lx = MARGIN + 2.4 * MM
      out.push(
        `<text x="${lx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${2.6 * MM}" ` +
          `letter-spacing="1" transform="rotate(-90 ${lx.toFixed(1)} ${cy.toFixed(1)})" ` +
          `text-anchor="middle">${esc(eraName(era, lang))}</text>`,
      )
    }
  }
  for (let year = -4000; year <= 2000; year += 500) {
    if (year === 0) continue
    const y = oy + scale.yearToY(year) * k
    out.push(
      `<text x="${(ox - 2 * MM).toFixed(1)}" y="${(y + 1).toFixed(1)}" font-size="${2.6 * MM}" text-anchor="end">` +
        `${year < 0 ? `${-year} BCE` : `${year}`}</text>`,
    )
  }

  for (const rect of layout.rects) {
    const p = polities.get(rect.polityId)
    if (!p) continue
    const dim = isDimmed(p, filters, null)
    const { fill, stroke } = styleFor(rect)
    const d = rect.runs
      .map(
        (r) =>
          `M${(ox + r.x0 * k).toFixed(1)} ${(oy + r.y0 * k).toFixed(1)}` +
          `V${(oy + r.y1 * k).toFixed(1)}H${(ox + r.x1 * k).toFixed(1)}` +
          `V${(oy + r.y0 * k).toFixed(1)}Z`,
      )
      .join('')
    out.push(
      `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="0.4"` +
        `${dim ? ' opacity="0.15"' : ''}/>`,
    )
    if (dim) continue

    let best = rect.runs[0]!
    let area = 0
    for (const r of rect.runs) {
      const a = (r.x1 - r.x0) * (r.y1 - r.y0)
      if (a > area) {
        area = a
        best = r
      }
    }
    const w = (best.x1 - best.x0) * k
    const h = (best.y1 - best.y0) * k
    const name = polityName(p, lang)
    const em = textWidthEm(name)
    const vertical = h > w * 2.2
    const size = vertical
      ? Math.min(3.6 * MM, w * 0.7, (h * 0.9) / em)
      : Math.min(4.2 * MM, (w * 0.92) / em, h * 0.7)
    if (size < 1.5) continue
    const cx = ox + ((best.x0 + best.x1) / 2) * k
    const cy = oy + ((best.y0 + best.y1) / 2) * k
    const rot = vertical
      ? ` transform="rotate(-90 ${cx.toFixed(1)} ${cy.toFixed(1)})"`
      : ''
    out.push(
      `<text x="${cx.toFixed(1)}" y="${(cy + size * 0.34).toFixed(1)}" font-size="${size.toFixed(2)}" ` +
        `text-anchor="middle" fill="${labelColorOn(fill)}"${rot}>${esc(name)}</text>`,
    )
  }

  const legendY = A1_H - MARGIN + 4 * MM
  REGIONS.forEach((r, i) => {
    const x = MARGIN + (i % 7) * (24 * MM)
    const y = legendY + Math.floor(i / 7) * (5 * MM)
    out.push(
      `<rect x="${x}" y="${(y - 2.4 * MM).toFixed(1)}" width="${2.4 * MM}" height="${2.4 * MM}" ` +
        `fill="${r.colorFamily}" stroke="${INK}" stroke-opacity="0.4" stroke-width="0.3"/>`,
      `<text x="${(x + 3.4 * MM).toFixed(1)}" y="${(y - 0.5 * MM).toFixed(1)}" font-size="${2.2 * MM}">` +
        `${esc(regionName(r.id, lang, r.name))}</text>`,
    )
  })
  out.push(
    `<text x="${MARGIN}" y="${(A1_H - MARGIN + 20 * MM).toFixed(1)}" font-size="${2 * MM}" fill-opacity="0.6">` +
      `${esc(ui('footnote', 'Rectangle height is lifespan; width reflects significance relative to contemporaries. The time scale is non-linear. (c) 2026 Chronos', lang))}</text>`,
  )
  out.push('</svg>')
  return out.join('\n')
}

/** Trigger a download of the current view as an A1 SVG. */
export function downloadPosterSvg(options: ExportOptions): void {
  const svg = buildPosterSvg(options)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chronos-world-history-A1.svg'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
