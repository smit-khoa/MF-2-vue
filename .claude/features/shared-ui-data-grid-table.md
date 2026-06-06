---
slug: shared-ui-data-grid-table
remote: n/a (packages/shared-ui — MF singleton)
route: n/a (reusable component)
roles: []
feature_flag: n/a
status: done
---

## Purpose
Reusable data-grid `Table` in shared-ui: virtualized rows/columns, frozen columns, column
resize, custom-column drag (show/hide/reorder + row-grouping), sort, pagination, row-select,
pivot mode, and **Excel-like range-select + copy** (opt-in). Ported from an external project
into the shadcn-vue/reka-ui design system.

## Flow
Caller passes `data` + `columns` (+ optional `tools`, `paging`, `pivotMode`, `showCheckbox`…)
-> Table virtualizes header/body/footer cells -> toolbar actions (refresh/zoom/custom-column)
emit events / open Dialog -> column header DropdownMenu does freeze + sort -> Pagination emits
`changePage(page, limit)` -> selection mutates `checkedConfig` (passed by ref).

## Files (MANDATORY — real paths, verified to exist)
- packages/shared-ui/src/components/ui/table/Table.vue — data-grid core (virtualization, frozen, resize, sort, pivot, render); wires range-select + overlay + Cmd+C
- packages/shared-ui/src/components/ui/table/CustomColumn.vue — Dialog + vuedraggable to show/hide/reorder columns and define row-groups
- packages/shared-ui/src/components/ui/table/Pagination.vue — page prev/next + range text + rows-per-page Select (15/25/50/100/200/500/1000/2000); internal
- packages/shared-ui/src/components/ui/table/RangeCopyPicker.vue — Dialog column picker for copy (select-all, copy-header, remember-preset)
- packages/shared-ui/src/components/ui/table/composables/use-range-copy.ts — pure copy core: getCopyEntries, escapeTSVCell, buildTSV, writeClipboard
- packages/shared-ui/src/components/ui/table/composables/range-copy-presets.ts — localStorage presets (hash, save/get/delete, subset match, picker default; key `range_copy_presets_<tableName>`, LRU 50)
- packages/shared-ui/src/components/ui/table/composables/use-table-range-selection.ts — reactive selection state + mouse/keyboard pipeline + auto-scroll + cellRangeLevel/actionsAnchor
- packages/shared-ui/src/components/ui/table/composables/range-coords.ts — pure geometry: colIndexFromX/rowIndexFromY (frozen+scroll, fixed/dynamic), cumulativeWidths, rangeToRect, clip fixed/scrollable
- packages/shared-ui/src/components/ui/table/composables/use-range-copy-flow.ts — Cmd+C decision tree (exact preset → subset → auto → picker) + picker state
- packages/shared-ui/src/components/ui/table/composables/__tests__/ — vitest: use-range-copy.test.ts (23) + range-coords.test.ts (13)
- packages/shared-ui/src/components/ui/table/style.css — data-grid layout/styling (`.data-grid-*`, `.range-overlay-*`, `.range-rect`, `.range-actions`)
- packages/shared-ui/src/components/ui/table/index.ts — exports only `Table`
- packages/shared-ui/vitest.config.ts — standalone vitest (jsdom) config for table composables
- packages/shared-ui/src/icons/sprite-symbols.ts — icon sprite (added restart/zoom/left/right/trash)

## APIs used
- none (presentational; consumer supplies data + handles emits)

## Related
[[adaccounts-basic-mode]] — likely consumer surface for tabular data
- `apps/ads-manager/src/pages/ComponentShowcasePage.vue` — live demo (frozen/resize/custom-column/sort/select/total/paging, custom cell slots via `#<field>`)

## Decisions / Gotchas
- **Overwrote shadcn-table primitives**: `ui/table` previously exported Table/TableHeader/
  TableBody/TableRow/TableHead/TableCell/TableCaption (shadcn). Those were removed and replaced
  by this data-grid. Breaking change to the singleton, done intentionally; no live app imported
  the old primitives (only a commented showcase block in ads-manager ComponentShowcasePage).
- **Pagination not exported**: data-grid has its own `Pagination.vue` but index.ts withholds it
  to avoid clashing with `ui/pagination`'s `Pagination` export.
- **Import relative, never `@/`**: inside shared-ui the `@` alias collides with each app's MF
  rspack alias and breaks the build — use relative paths.
- **scss → plain CSS**: rspack has no scss loader; Pagination/CustomColumn style blocks were
  converted to plain CSS (`@extend` inlined).
- **Theming**: the source shipped hardcoded light colors (white bg, `#e0e0e0` borders, `#0969da`).
  All mapped to design-system CSS vars (`--background`, `--muted`, `--border`, `--foreground`,
  `--primary`, `--accent`, `--destructive`, `--muted-foreground`) so the grid follows the app's
  (dark) theme. `getCellBackground` returns token strings now. The 8 `highlight-*` classes keep
  literal pastel colors on purpose (semantic colour-highlighting feature). Pagination prev/next use
  `<Icon name="left|right">` instead of the old mask-image arrows.
- **Dropped deps mapped to shared-ui**: Button icon-prop → `<Icon>` slot; Dropdown → DropdownMenu
  (tooltip-on-disabled dropped); Popup → Dialog; Checkbox `@change` → `@update:model-value`.
- **Known pre-existing issues carried over (NOT fixed — out of scope)**: grouping mode
  (`groupedData`) currently returns HARDCODED MOCK data instead of `props.data`; several emits
  (`row-select`/`row-select-all`/`column-toggle`) are declared but never emitted; `checkedConfig`
  prop is mutated directly; `JSON.parse(localStorage)` unguarded; ~22 `console.log`. Address
  before any app turns on grouping / relies on selection emits.
- **Runtime feature checklist (frozen/resize/drag/sort/pagination) not browser-verified** — only
  typecheck (6/6 pass) + rspack build (ads-manager + shell pass) were verified.

## Range-select + copy (Excel-like) — opt-in
- **Props**: `enableRangeSelect?: boolean` (default false → zero regression), `formatCopyValue?: (key,row) => string|undefined`.
  Column gains optional `type?`/`copyable?`/`copyFields?` (additive). Toast already exported via `ui/sonner`.
- **Activation guard**: only on plain tables — `enableRangeSelect && !pivotMode && rowGroups.length===0`.
  Group/pivot use indented/summary rows the index-based coordinate model does not cover.
- **Coordinate model (differs from source mixin)**: scroll container is `dataGridMain` (native scroll,
  holds scrollTop+scrollLeft). checkbox width 60, header height 50 (source used 61/44).
  Row index ↔ `finalDataForRendering`; `rangeRows` unwraps `.data`.
- **Highlight = cell-background paint, NOT an overlay layer**: `cellRangeLevel(rowIndex,colIndex)` →
  `rangeCellClass(rowIndex,field)` applies `.range-cell` / `.range-cell--primary` to each in-range cell.
  `colRangeLevel(colIndex)` → `headerRangeClass(field)` tints the header of selected columns the same
  (`.header-cell.range-col` / `.range-col--primary`). Solid `color-mix(--primary, --background)` (no alpha)
  so overlapping frozen+scrollable cells never stack transparency; frozen cells stay pinned on scroll
  (native sticky, no translateX lag). `.range-cell`/`.range-col` use `!important` to beat the inline
  `background` from getCellBackground (stripe/frozen) and the header's `--muted`. `rangeColIndexByField`
  maps field→index over the FULL visibleColumns so it is stable under horizontal virtualization.
- **Row hover background disabled** (all tables): `.grid-row:hover` colour rules removed so nothing fights
  the range tint; `.grid-row:hover { z-index:5 }` kept for cell-custom slide-up. Header columns are divided
  by `border-right: var(--border-table)` (matches row cells).
- **Floating copy/settings buttons** (`actionsAnchor`): live in grid-content (content space). Position =
  range bottom-right corner inset inward, then CLAMPED to the currently-scrolled visible window
  (using scrollLeft/Top + viewportWidth + containerHeight + frozenWidth) so the cluster pins to the table
  edge and never disappears when the range scrolls out of view. Hidden only while dragging or single-cell.
- **Copy flow** (use-range-copy-flow): exact preset → column-aware subset preset → no-multi-field auto-copy
  → picker. TSV via `buildTSV` (default `String(row[field] ?? "")`, `formatCopyValue` override). Clipboard:
  navigator.clipboard in secure context, textarea+execCommand fallback. Soft cap `COPY_CELL_CAP=10000`.
  Presets keyed by sorted column-key hash, per table, LRU 50.
- **Interactions**: drag cell range (delayed activation keeps native text-select until mouse leaves anchor),
  Ctrl/Cmd multi-range, Shift extend, header click/drag = column select, auto-scroll near edges (RAF),
  Cmd/Ctrl+C copy (skipped while editing input/textarea/contenteditable), ESC / click-outside clear.
- **Not browser-verified**: pure logic has 36 vitest tests; selection/overlay/copy UI verified only by
  typecheck + build. Manual checklist (drag overlay alignment under frozen+scroll, multi-range, paste into
  Excel, preset memory) still pending a real browser pass.
