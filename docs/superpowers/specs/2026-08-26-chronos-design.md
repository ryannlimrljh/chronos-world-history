# Chronos — design addendum

Date: 2026-08-26

`world-history-timeline-brief.md` is the spec. This document records only the decisions the brief left open and the one place I am deviating from it. Where this document is silent, the brief governs.

## Resolved decisions

**Data sourcing.** The v0 dataset (~120 polities) is generated from my own knowledge, not web-verified entry by entry. Every entry carries an honest `startPrecision` / `endPrecision` and an honest `confidence` on the dating. Anything I am not solid on goes into `data/REVIEW.md` as an explicit line item rather than being written down as a confident number. Pre-1000 BCE dates are `circa` or `century` by default and `exact` only where the record genuinely supports it, which is rare.

**Typefaces.** Archivo (Black / ExtraBold, condensed-leaning) for the title block, Barlow Condensed for rect labels and the axis. Both from Google Fonts via CDN. Consequences I am accepting: a network dependency at load, and a brief flash of fallback type before the faces arrive. Both faces are declared through CSS custom properties (`--font-display`, `--font-label`) so swapping in self-hosted or licensed files later is a one-file change. The SVG export embeds text as `<text>` with the family names declared, so a print house needs the fonts installed or the file converted to outlines. That is noted in the export's own footnote.

## Deviation from the brief: layout engine pass ordering

The brief's engine steps run 1 through 5 in sequence: slice, compute lane demand, allocate widths, smooth boundaries vertically, then pack sub-columns within each lane-slice.

Steps 4 and 5 conflict. Smoothing lane boundaries in step 4 can narrow a lane below the width its packed sub-columns need in step 5. When that happens the rects either overflow across a lane boundary, which destroys the geographic reading the colour system depends on, or they get crushed to sub-pixel widths.

The engine will instead run:

1. Slice the timespan.
2. Pack each lane-slice into sub-columns first, by greedy interval assignment, to learn the lane's **true** sub-column count and its significance-weighted width demand.
3. Allocate slice width across lanes proportional to demand, with a per-lane floor.
4. Smooth boundaries vertically, subject to a hard constraint: a lane may never smooth below the floor established in step 2 for any slice it spans.
5. Re-pack against the final widths, then run the leftward compaction pass.

One extra pass. It keeps the stepped silhouette the brief asks for while guaranteeing no rect crosses a lane edge. If smoothing proves too constrained by the floors and the boundaries come out jittery, the tunable is the smoothing window length, not the floor.

## Everything else

Unchanged from the brief: stack, phases 0 through 7, phase gate check-ins with a screenshot, the fidelity check's five questions before any visual phase is called done, determinism in the engine, and the instruction to say so if something in the brief turns out to be wrong once I am in the code.
