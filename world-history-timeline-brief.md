# Project brief: Chronos — an interactive 5,000-year world history timeline

You are building a web application from scratch. Read this whole brief before writing any code, then confirm the plan back to me in a short summary and start at Phase 0.

## What it is

A dense, poster-grade visualization of world history: a vertical time axis running from ~4000 BCE at the top to the present at the bottom, with every polity (empire, kingdom, dynasty, caliphate, khanate, republic, confederation) drawn as a filled rectangle. Rectangle height = duration on the time scale. Rectangle width = relative significance. Rectangles are packed into geographic lanes running west-to-east across the x-axis, so the whole thing reads as a mosaic of history — you can see at a glance that the Roman Empire and the Han Dynasty were contemporaries, and that the gap after Rome in Western Europe is where a dozen small kingdoms fragment.

It is modeled on a Chinese wall poster ("World History: 5000-Year Timeline"), but this is our own dataset, our own layout engine, and our own visual system. Do not attempt to reproduce that poster's artwork or copy its data.

Three modes, all sharing one renderer:
1. **Explore** — free zoom/pan across the full mosaic.
2. **Filter & search** — narrow by region, era, category, significance; jump to any polity.
3. **Tour** — scroll-driven narrative chapters that move the camera and change filter state while a narration panel tracks alongside.

## Data model

Two JSON files under `data/`, with TypeScript types in `src/types.ts` that are the single source of truth.

```ts
type Year = number;              // negative = BCE, no year zero
type Precision = 'exact' | 'circa' | 'century' | 'disputed';

interface Polity {
  id: string;                    // slug, e.g. 'tang-dynasty'
  name: string;                  // English
  nameNative?: string;           // 唐朝, Imperium Romanum, etc.
  aka?: string[];                // alternate names for search
  start: Year;
  end: Year;                     // for still-extant states, use CURRENT_YEAR
  startPrecision: Precision;
  endPrecision: Precision;
  region: RegionId;              // must match a lane
  subregion?: string;
  category: 'empire' | 'kingdom' | 'dynasty' | 'republic' | 'caliphate'
          | 'khanate' | 'confederation' | 'city-state' | 'colonial' | 'modern-state';
  significance: 1 | 2 | 3 | 4 | 5;   // 5 = Rome, Han, Ottomans. Drives column width.
  predecessors?: string[];       // polity ids
  successors?: string[];
  parent?: string;               // e.g. 'western-roman-empire' -> parent 'roman-empire'
  capital?: string;
  blurb: string;                 // 1–2 sentences, plain, no adjectival hype
  confidence: 'high' | 'medium' | 'low';   // on the dating, not the existence
  wikipedia?: string;
}

interface HistoricalEvent {
  id: string;
  year: Year;
  precision: Precision;
  title: string;
  category: 'technology' | 'religion' | 'conflict' | 'exchange' | 'science' | 'text';
  blurb: string;
  relatedPolities?: string[];
}
```

Also define `Era[]` (Neolithic, Bronze Age, Axial Age, Classical, Late Antiquity, Medieval, Age of Sail, Industrial, Modern) as a static config, and `Region[]` as the lane definitions.

### Region lanes, west to east

`europe-west`, `europe-central`, `mediterranean`, `north-africa`, `sub-saharan-africa`, `near-east`, `iran-mesopotamia`, `central-asia-steppe`, `south-asia`, `southeast-asia`, `east-asia`, `korea-japan`, `americas`, `oceania`.

Each lane gets a base colour family; each polity's fill is derived from its lane's family, modulated by category. This is what makes the mosaic legible — a viewer should learn "green = Persia/Iran" within thirty seconds without reading a legend.

### Generating the seed data — do this carefully

I am asking you to generate the dataset, which means accuracy is on you. Rules:

- **Tier the work.** v0 = ~120 anchor polities covering every lane and every millennium, enough to prove the layout engine. v1 = expand to ~400. Do not attempt 400 in one pass; you will hallucinate dates.
- **Never invent precision.** If a start date is contested or approximate, set `startPrecision` accordingly and `confidence: 'medium' | 'low'`. Egyptian Old Kingdom dating and anything pre-1000 BCE should almost never be `exact`.
- **Write a validation script** (`scripts/validate-data.ts`) that fails the build on: `end < start`, unknown region ids, dangling predecessor/successor/parent ids, duplicate ids, any lane with a gap of >300 years with zero entries, and any century with zero global coverage. Run it after every data change.
- **Add a coverage report** so I can see the shape of what's missing: entries per lane per century, as a table printed to stdout.
- Flag anything you're unsure about in a `data/REVIEW.md` list rather than quietly guessing. I would much rather see "these 30 dates need a historian's eye" than a confident wrong number.
- Deliberately fight Eurocentric density. The Americas, sub-Saharan Africa, Southeast Asia and Oceania lanes must be genuinely populated, not three token entries each.

## The layout engine — the hard part, build it first and build it clean

`src/layout/` must be pure TypeScript with zero React and zero DOM. Signature roughly:

```ts
function layout(polities: Polity[], config: LayoutConfig): PositionedRect[]
```

Requirements:

**Non-linear time scale.** Ancient history is sparse, modern history is dense. Implement a piecewise-linear scale with configurable breakpoints (e.g. 4000 BCE–1000 BCE compressed, 1000 BCE–1500 CE normal, 1500 CE–present expanded), exposed as `yearToY(year)` and `yToYear(y)`. Ship it as a swappable scale object so I can try log and linear too.

**Soft lanes, not fixed columns.** This is the single most important thing in the engine and the thing most likely to be got wrong. Region lanes are *not* fixed vertical strips of constant width. A lane's width varies by time slice according to how much is happening in it. In 200 CE the Mediterranean lane is one enormous block (Rome) and Western Europe is nearly nothing; in 1300 CE the Mediterranean has narrowed and Western Europe has exploded into a dozen thin columns. Get this wrong and you produce a Gantt chart, not the reference.

Implement it as:

1. Slice the full timespan into rows (25-year slices is a reasonable start, tune it).
2. For each slice, compute each lane's demand = the number of concurrent sub-columns it needs, weighted by the `significance` of its occupants.
3. Allocate that slice's total canvas width across lanes proportional to demand, with a small floor so an active lane never collapses to zero. Lane order (west→east) is fixed; only widths flex.
4. Smooth the resulting lane boundaries vertically so edges step rather than jitter — a lane boundary should hold steady for a long stretch and then shift, which is what produces the reference's blocky stepped silhouette.
5. Within a lane-slice, pack polities into sub-columns by greedy interval assignment: sort by start year, assign each to the leftmost sub-column with no time collision. Sub-column widths within the lane are proportional to `significance`.

**Ragged edges are the point.** Don't force the mosaic into a rectangle. The overall silhouette should read like a city skyline: narrow at the top where 4000 BCE has four or five entries, widening downward, with a stepped ragged left and right edge and occasional tall isolated towers rising above the mass (the early Egyptian dynasties in the reference do exactly this). Empty space around the mosaic is part of the composition — it is where the title block, the milestone list and the landmark illustrations live.

**Nesting.** A polity with a `parent` renders *inside* its parent's rectangle as an inset band, not as a sibling column. Western/Eastern Roman Empire inside Roman Empire; the Diadochi kingdoms inside a Hellenistic band.

**Minimise gaps.** After the greedy pass, run a compaction step: any rect with empty space to its left in the same lane shifts left and widens if no collision. The target aesthetic is a near-solid mosaic, not a sparse Gantt chart.

**Determinism.** Same input, same output, every time. No `Math.random()`, no `Date.now()` inside the engine.

**Tests.** Vitest. Cover: overlapping intervals never share a sub-column; nesting containment holds; the scale is monotonic and round-trips within one pixel; a known fixture of 20 polities produces a stable snapshot.

## Rendering

- **Base layer: `<canvas>`.** Draw all rects with flat fills and a 1px darker stroke. Must hold 60fps while panning with 2,000+ rects.
- **Label layer: DOM.** Only render a label element for a rect whose on-screen area exceeds a threshold. Semantic zoom — at far zoom only significance-5 polities are labelled; zoom in and labels appear in tiers. English name always; native name as a second line when the rect is tall enough.
- **Hit testing:** an interval tree or a hidden colour-index canvas, not a linear scan over 2,000 rects on every mousemove.
- **Time axis:** fixed left gutter with year ticks and era bands, always visible during vertical pan.
- **Region header:** sticky top strip naming the lanes, aligned to their x positions, always visible during horizontal pan.

## Interactions

1. **Zoom & pan.** Wheel + pinch + drag. Clamp so you can't lose the mosaic off-screen. Double-click zooms to fit that polity.
2. **Hover.** Lightweight tooltip: name, native name, date range with precision, duration in years.
3. **Click → detail drawer.** Right-side panel: full blurb, capital, category, era, predecessors and successors as clickable chips (clicking navigates and re-centres), a "contemporaries" list of everything alive in the midpoint year, and an outbound Wikipedia link. Never block the mosaic — the drawer overlays at most 380px.
4. **Search.** ⌘K / Ctrl+K palette, fuzzy over `name`, `nameNative`, `aka`, `capital`. Enter zooms to the match and pulses it.
5. **Filters.** Region multi-select, category, era, significance floor. Filtered-out rects don't vanish — they desaturate to 15% opacity, so you keep the spatial memory of the whole.
6. **Time cursor.** Drag a horizontal line down the canvas; everything not alive at that year desaturates, and a readout shows the year plus a count of concurrent polities. This is the single best "wait, *that* was happening at the same time?" moment in the product — make it feel good.
7. **Compare.** Shift-click up to 4 polities to pin them highlighted with a small comparison bar showing durations side by side.
8. **URL state.** `?year=618&region=east-asia&id=tang-dynasty&zoom=2.4`. Every view is linkable. Back button works.

## Tour mode

`data/chapters.ts` defines an ordered list of authored chapters. Each chapter is a declarative camera + state target:

```ts
interface Chapter {
  id: string;
  title: string;
  narration: string;       // 80–150 words
  camera: { yearCenter: Year; yearSpan: number; regions: RegionId[] };
  highlight: string[];     // polity ids to spotlight
  filters?: Partial<FilterState>;
}
```

Scroll position drives interpolation between chapter camera states; the mosaic animates, the narration panel cross-fades. Seed chapters: the Bronze Age Collapse, the Axial Age, the fall of the Western Empire, the Arab expansion, the Mongol century, the Age of Sail, 1914. Respect `prefers-reduced-motion` by cutting instead of tweening.

Tour must reuse the same renderer and the same state store as Explore — it is a driver, not a second app.

## Visual fidelity — match the reference

The target is a printed wall poster in the Histomap lineage (John B. Sparks, 1931 — worth looking at, it's the ancestor of this whole format and it's public domain). Not a data dashboard. Not a web app that happens to show history. If a viewer's first reaction is "is that a screenshot of a poster?", you've hit it. Build our own data and our own artwork, but follow the reference's design logic precisely.

### Canvas composition

The poster is a single tall portrait sheet, roughly 1:1.4 (A-series). Its zones:

- **Top-left, ~40% width:** the title block. `WORLD HISTORY` set in a very heavy condensed grotesque, near-black, two lines, tight leading, almost no letterspacing. One letter is replaced by a glyph — the reference swaps the O in HISTORY for a clock face. Do something equivalent and restrained. Beneath it, `5000-Year Timeline` in a thin-stroked rounded pill outline, small, centred in the pill.
- **Below the title, still top-left:** a three-column list of ~30 human-civilisation milestones (invention of the wheel, Code of Hammurabi, birth of Buddhism, Silk Road opening, Gutenberg press, and so on), each a tiny marker glyph plus one line. Set very small — this is texture as much as content, and it fills the negative space left by the sparse early millennia.
- **Far-left gutter, full height:** the time axis. Year ticks every 200 years in the ancient stretch, every 100 in the modern. To the *left* of the ticks, a second column of vertical era brackets with rotated labels (Neolithic, Bronze Age, Axial Age, Late Classical, Medieval, Age of Sail & Colonialism, Industrial, Modern). Year 1 CE gets a black filled pill with reversed-out type — it's the one datum the whole chart pivots on and it must be the most emphatic thing in the gutter.
- **Centre and right, ~85% of the height:** the mosaic.
- **Bottom strip:** a row of national flags marking the modern states that terminate the chart, each with a small caption, aligned to the x position of the lane they descend from.
- **Bottom rule:** a legend row of category swatches, then a single line of footnotes in the smallest size (including the note that the time scale is non-linear), then the copyright.
- **Landmark silhouettes:** a handful of flat monochrome landmark illustrations tucked into the empty margins where the mosaic's ragged edge leaves room — the reference puts Big Ben and the Statue of Liberty at the lower left and a pagoda at the right. Grey, flat, no detail beyond silhouette plus a few internal lines. These are what stop the whitespace reading as an error. Use SVG paths, no images.

### Colour

Sample discipline matters more than exact hexes, but this is the register:

- Background: warm blush off-white, around `#FAF0EC` — pink-tinted, not cream and not grey.
- Fills: flat, fully opaque, mid-saturation, and slightly chalky, as if screen-printed. The families in the reference are salmon/coral, sage green, sea green, cornflower blue, brick red, amber-tan, and a muted mint. Assign one family per region lane and derive three or four tints within each family for category and for adjacent-block separation. Adjacent rectangles from the same lane must be *distinguishable but clearly related* — that alternation is a big part of the texture.
- Strokes: 1px hairline in the fill colour darkened roughly 25%, on every rectangle, always. Never borderless. Corner radius 0–2px, no more.
- Nothing else gets colour. Title, axis, labels, footnotes are all near-black on the blush. No accent colour in the chrome.
- Contrast rule: label text is near-black on light fills and pure white on the darker reds and blues. Compute it, don't hardcode it.

### Type

- **Labels:** a tight condensed grotesque. The rectangles are narrow and width efficiency beats personality here. Each labelled rect gets the English name in caps, and where the rect is tall enough, a second line at ~70% size with the native-script name, and on the largest rects a third line of description at ~55% size. Centred both axes within the rect.
- **Display:** the title face is heavier and more condensed than the label face — it should look like a signage face, not an editorial serif.
- **Sizes are tiered by rect size, not uniform.** The reference has at least five distinct label sizes on screen at once. That range is a large part of why it reads as dense and considered rather than flat.
- Tabular numerals everywhere. This is a document made of dates.
- Small markers: tiny circular badges pinned to the corner of certain rects to flag linked events. Numbered or glyphic, ~8px.

### Density is the signature

Do not add chrome, gradients, glows, ambient motion, or decorative flourishes. The wow moment is *density* — the fact that it looks like something printed at A1 that you can zoom into. Everything interactive should feel like it's floating quietly above a physical artefact: the drawer, the command palette and the filter bar sit on the blush background with a hairline border and no shadow, and they get out of the way.

Responsive floor: below 900px, drop to a single-lane vertical scroll with a region switcher. Keyboard focus visible on every interactive element. Arrow keys pan, +/- zoom. Respect `prefers-reduced-motion`.

### Fidelity check

Before you tell me a visual phase is done, screenshot the app at full zoom-out and hold it against the reference. Ask specifically:

1. Is the silhouette ragged and stepped, widening downward, with isolated towers at the top? Or is it a rectangle?
2. Are there visible gaps inside the mosaic body? There should be almost none below 500 BCE.
3. Are five or more distinct label sizes visible at once?
4. Does the negative space look composed — occupied by title, milestone list, landmarks — or does it look like a layout bug?
5. Squinting, do the colour families group geographically, so the eye reads continents without reading a single word?

If any answer is no, fix it before moving on and tell me which one failed.

## Stack

React 19 + Vite + TypeScript, strict mode. Zustand for the view state store. Vitest for the engine tests. No component library — the UI surface is small and a design system would fight the visual direction. Tailwind is fine for the chrome; the canvas obviously doesn't use it.

Also build an **SVG export** (`Export → poster.svg`) that renders the current filter state at print dimensions (A1, 594×841mm), labels included, no interactive chrome. I want to be able to actually print this.

## Build order — do not skip ahead

- **Phase 0.** Scaffold, types, region config, era config, 20 hand-picked polities as a fixture. Nothing rendered yet.
- **Phase 1.** Layout engine + tests, verified against the 20-polity fixture with a plain SVG debug render. Get the packing right before anything is pretty.
- **Phase 2.** Canvas renderer, time axis, region headers, zoom/pan.
- **Phase 3.** v0 dataset (~120 polities) + validation + coverage report. Stop and show me the coverage table.
- **Phase 4.** Hover, detail drawer, search, filters, time cursor, URL state.
- **Phase 5.** Full poster composition: title block, milestone list, era brackets, flag row, legend, footnotes, landmark silhouettes, colour system, five-tier label sizing. Then run the fidelity check above, screenshot it, and report which of the five questions failed and what you changed. This phase is not "styling" — it is half the product, and it is the phase I will judge the build on.
- **Phase 6.** Tour mode + chapters.
- **Phase 7.** Dataset expansion to ~400, SVG export, mobile fallback.

Check in with me at the end of each phase with a screenshot and what you'd do differently. If a decision in this brief turns out to be wrong once you're in the code — especially anything in the layout engine — say so rather than working around it.
