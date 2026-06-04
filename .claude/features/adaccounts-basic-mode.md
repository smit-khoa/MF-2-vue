---
slug: adaccounts-basic-mode
remote: adaccounts
route: /app/adaccounts
roles: []
feature_flag: n/a
status: done
---

## Purpose
Provide basic account management interface for AdAccounts (TKQC) — select ad accounts via multi-row table, view tool groups/functions in side panel, and execute demo actions (with runtime mode toggle to advanced mode placeholder).

## Flow
1. AdAccountsPage mounts, reads mode-store (basic|advanced).
2. basic mode -> render BasicModeView (grid layout: 3/4 table + 1/4 panel).
3. User selects rows in AdAccountTable (local selection state via use-ad-accounts composable).
4. User clicks tool group -> ToolGroupGrid expands, shows functions.
5. User clicks function -> use-tool-actions triggers demo toast "Đã chọn N TKQC" (N = selected count).
6. User clicks "Chuyển sang chế độ nâng cao" button -> mode-store.setMode('advanced') -> AdvancedModePlaceholder renders.
7. Mode toggle is runtime-only, no URL param — same route.

## Files (MANDATORY — real paths, verified to exist)
- apps/adaccounts/src/pages/AdAccountsPage.vue — route view, delegates to basic/advanced based on mode-store
- apps/adaccounts/src/modes/basic/BasicModeView.vue — main layout: grid(3/4 table, 1/4 panel)
- apps/adaccounts/src/modes/basic/AdAccountTable.vue — multi-select table, emits selection changes
- apps/adaccounts/src/modes/basic/tool-panel/ToolPanel.vue — root panel container
- apps/adaccounts/src/modes/basic/tool-panel/ToolGroupGrid.vue — grid of tool groups, click expands to functions
- apps/adaccounts/src/modes/basic/tool-panel/ToolFunctionGrid.vue — grid of functions, click triggers action
- apps/adaccounts/src/modes/advanced/AdvancedModePlaceholder.vue — text-only "Coming soon, đang phát triển"
- apps/adaccounts/src/stores/mode-store.ts — useModeStore: mode state, setMode(m) setter
- apps/adaccounts/src/composables/use-ad-accounts.ts — selected accounts selection state (module-scoped, persists across nav)
- apps/adaccounts/src/composables/use-tool-actions.ts — group/function selection, demo action trigger
- apps/adaccounts/src/components/DemoActionToast.vue — UI toast "Đã chọn N TKQC"
- apps/adaccounts/src/data/mock-ad-accounts.ts — static AdAccount[] mock data
- apps/adaccounts/src/data/mock-tool-groups.ts — static ToolGroup[] + ToolFunction[] mock data
- apps/adaccounts/src/types/ad-account.ts — AdAccount, ToolGroup, ToolFunction (local types, not promoted to shared-types)

## APIs used
- none (demo mode, all data mock-static, no gateway calls)

## Related
[[remote-loading-recovery]]

## Decisions / Gotchas
- **Selection state module-scoped:** use-ad-accounts composable holds selected rows in a module-level ref, intentionally NOT cleared on unmount, so user's selection persists across sidebar navigation back/forward. This is a deliberate demo behavior, not a bug.
- **Mode runtime-only:** useModeStore is local Pinia, not persisted to localStorage — mode resets to 'basic' on page reload. This is acceptable for prototype.
- **Toast content:** Shows count of selected accounts + their names. Action is demo-only (no side-effect, no API call).
- **Advanced mode is placeholder:** Button routes to AdvancedModePlaceholder, not real UI. Content = "Chế độ nâng cao đang phát triển".
