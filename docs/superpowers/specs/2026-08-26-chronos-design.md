# Chronos — design addendum

Date: 2026-08-26

`world-history-timeline-brief.md` is the spec. This document records only the decisions the brief left open and the one place I am deviating from it. Where this document is silent, the brief governs.

## Resolved decisions

**Data sourcing.** The v0 dataset (~120 polities) is generated from my own knowledge, not web-verified entry by entry. Every entry carries an honest `startPrecision` / `endPrecision` and an honest `confidence` on the dating. Anything I am not solid on goes into `data/REVIEW.md` as an explicit line item rather than being written down as a confident number. Pre-1000 BCE dates are `circa` or `century` by default and `exact` only where the record genuinely supports it, which is rare.

**Typefaces.** Archivo (Black / ExtraBold, condensed-leaning) for the title block, Barlow Condensed for rect labels and the axis. Both from Google Fonts via CDN. Consequences I am accepting: a network dependency at load, and a brief flash of fallback type before the faces arrive. Both faces are declared through CSS custom properties (`--font-display`, `--font-label`) so swapping in self-hosted or licensed files later is a one-file change. The SVG export embeds text as `<text>` with the family names declared, so a print house needs the fonts installed or the file converted to outlines. That is noted in the export's own footnote.

## Deviation from the brief: the layout engine algorithm

The brief's engine (slice, allocate lane widths, smooth, pack into lanes) has a structural flaw discovered during Phase 1: a rectangle's edges must be straight for its whole lifespan, but per-slice lane widths flex over time. A 400-year polity cannot live inside a lane whose width changes underneath it. The poster's human designer resolved this by hand; an algorithm needs a different formulation.

The shipped engine inverts the dependency. Lane widths are never chosen; they emerge from where rectangles land.

1. **Width per rect** = its significance as a share of the world's mean total significance across its own lifetime, of the target canvas width. The divisor is floored (at 24 significance points) so near-empty millennia produce narrow isolated towers, not full-canvas slabs.
2. **Sub-columns** within a lane by greedy interval assignment, exactly as the brief specifies. Touching endpoints do not collide, so a successor continues its predecessor's column.
3. **Anchor per rect**: a home x position, the demand west of its lane as a fraction of world demand, blended 50/50 between the rect's own lifetime and all of history, scaled by `anchorStrength`. This keeps China right and Europe left even in sparse eras.
4. **Placement**: rects processed west-to-east, each placed at `max(anchor, rightmost edge of every contemporary that must sit west of it)` — contemporaries in more-western lanes, and same-lane contemporaries in earlier sub-columns. Leftmost-feasible placement makes compaction inherent rather than a separate pass.
5. **Succession continuity**: a rect starting exactly where its column's previous occupant ended inherits that occupant's x as its anchor, so Republic→Empire→Western Rome reads as one vertical run.
6. **Lane bands** are computed afterwards from the placed rects, per time slice, for the sticky region headers.

**Nesting is split into two cases.** A child alive during its parent (Diadochi in a Hellenistic band) nests as an inset band, recursively, splitting the parent's inner width by significance. A child that begins at or after the parent's end (Byzantium after Rome) is a *continuation*: packed as an ordinary top-level rect, connected to the parent by the succession rule instead of being forced inside the parent's footprint — otherwise the child's later neighbours (the Holy Roman Empire in 1100 CE) would push the long-dead parent around the canvas. This matches the reference poster, which draws Byzantium as its own block below Rome.

Known cosmetic gap, deferred to Phase 3: with only 20 fixture polities, Byzantium starts east of Rome's footprint with whitespace between them, because nothing exists yet to fill Italy/Iberia in 400–900 CE. The v0 dataset should close it naturally; reassess after Phase 3.

The brief's smoothing step is dropped entirely: stepped silhouettes emerge from rect edges. The brief's explicit compaction pass is dropped because leftmost-feasible placement subsumes it. `LayoutConfig` gained `anchorStrength`/`minRectWidth`/`gap` and lost `laneMinWidth`/`laneGap`/`smoothingWindow`.

## Everything else

Unchanged from the brief: stack, phases 0 through 7, phase gate check-ins with a screenshot, the fidelity check's five questions before any visual phase is called done, determinism in the engine, and the instruction to say so if something in the brief turns out to be wrong once I am in the code.
