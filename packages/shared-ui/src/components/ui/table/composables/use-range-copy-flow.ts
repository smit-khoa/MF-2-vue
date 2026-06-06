// Cmd+C copy flow — ties selection ranges to copy-core + presets + picker.
// Mirrors the source mixin's _handleCopyShortcut decision tree:
//   1. exact preset hit            → auto-copy that selection
//   2. column-aware subset preset  → auto-copy the covered intersection
//   3. no multi-field column       → auto-copy everything
//   4. multi-field + no preset     → open picker with a smart default
// Toast + picker rendering are injected so this stays UI-library-agnostic.

import { reactive } from "vue"
import { buildTSV, getCopyEntries, writeClipboard, COPY_CELL_CAP, type BuildTSVOptions, type CopyableColumn, type CopyEntry, type CopyRange } from "./use-range-copy"
import { computePickerDefault, deletePreset, findSubsetPresetByColumn, getPreset, getPresets, hashColumnSet, savePreset } from "./range-copy-presets"

export interface PickerColumn {
    key: string
    label: string
}

export interface RangeCopyFlowOptions {
    // Reactive getters supplied by Table.vue
    getActiveRange: () => CopyRange | null
    getColumns: () => CopyableColumn[]
    getRows: () => Record<string, any>[]
    getTableName: () => string
    formatCopyValue?: (key: string, row: Record<string, any>) => string | undefined
    // UI hooks
    toastSuccess: (msg: string) => void
    toastWarning: (msg: string) => void
    toastError: (msg: string) => void
}

const MSG = {
    noColumns: "Không có cột nào để sao chép",
    tooLarge: `Vùng chọn quá lớn (tối đa ${COPY_CELL_CAP} ô)`,
    copied: "Đã sao chép vào clipboard",
    copyFailed: "Không thể sao chép vào clipboard",
    presetReset: "Đã xoá ghi nhớ lựa chọn cột"
}

export function useRangeCopyFlow(opts: RangeCopyFlowOptions) {
    // Picker state — rendered by Table.vue via <RangeCopyPicker>.
    const picker = reactive({
        visible: false,
        columns: [] as PickerColumn[],
        defaultSelected: [] as string[],
        copyHeader: false,
        showReset: false,
        // snapshot taken when the picker opens
        range: null as CopyRange | null,
        entries: [] as CopyEntry[],
        hash: ""
    })

    function buildOptions(includeHeader: boolean): BuildTSVOptions {
        return { includeHeader, ...(opts.formatCopyValue ? { formatCopyValue: opts.formatCopyValue } : {}) }
    }

    async function copyEntries(range: CopyRange, entries: CopyEntry[], includeHeader: boolean): Promise<void> {
        const tsv = buildTSV(range, entries, opts.getRows(), buildOptions(includeHeader))
        const ok = await writeClipboard(tsv)
        if (ok) opts.toastSuccess(MSG.copied)
        else opts.toastError(MSG.copyFailed)
    }

    // Main Cmd+C / action-button entrypoint.
    async function handleCopyShortcut(): Promise<void> {
        const range = opts.getActiveRange()
        if (!range) return

        const columns = opts.getColumns()
        const entries = getCopyEntries(columns, range.colStart, range.colEnd)
        if (!entries.length) {
            opts.toastWarning(MSG.noColumns)
            return
        }

        const rowCount = range.rowEnd - range.rowStart + 1
        if (rowCount * entries.length > COPY_CELL_CAP) {
            opts.toastWarning(MSG.tooLarge)
            return
        }

        const tableName = opts.getTableName()
        const entryKeys = entries.map(e => e.key)
        const hash = hashColumnSet(entryKeys)
        const preset = getPreset(tableName, hash)

        // 1. Exact preset match → auto copy
        const validSelected = preset ? preset.selectedKeys.filter(k => entryKeys.includes(k)) : []
        if (preset && validSelected.length) {
            const effective = entries.filter(e => validSelected.includes(e.key))
            await copyEntries(range, effective, !!preset.copyHeader)
            return
        }

        // 2. Column-aware subset preset → auto copy intersection
        const subset = findSubsetPresetByColumn(entries, getPresets(tableName))
        if (subset) {
            const saved = new Set(subset.selectedKeys)
            const effective = entries.filter(e => saved.has(e.key))
            if (effective.length) {
                await copyEntries(range, effective, !!subset.copyHeader)
                return
            }
        }

        // 3. No preset + no multi-field column → auto copy all
        const fieldCount: Record<string, number> = {}
        entries.forEach(e => {
            const p = e.parentKey || e.key
            fieldCount[p] = (fieldCount[p] || 0) + 1
        })
        const hasMultiField = Object.values(fieldCount).some(c => c > 1)
        if (!hasMultiField) {
            await copyEntries(range, entries, false)
            return
        }

        // 4. Multi-field + no preset → open picker with smart default
        openPicker(range, entries, computePickerDefault(entries, getPresets(tableName)), false)
    }

    // Settings action: always open the picker to edit the preset.
    function handleSettings(): void {
        const range = opts.getActiveRange()
        if (!range) return
        const entries = getCopyEntries(opts.getColumns(), range.colStart, range.colEnd)
        if (!entries.length) {
            opts.toastWarning(MSG.noColumns)
            return
        }
        const tableName = opts.getTableName()
        const entryKeys = entries.map(e => e.key)
        const hash = hashColumnSet(entryKeys)
        const preset = getPreset(tableName, hash)
        const defaultSelected = preset ? preset.selectedKeys.filter(k => entryKeys.includes(k)) : computePickerDefault(entries, getPresets(tableName))
        openPicker(range, entries, defaultSelected, preset ? !!preset.copyHeader : false)
    }

    function openPicker(range: CopyRange, entries: CopyEntry[], defaultSelected: string[], copyHeader: boolean): void {
        const columns = entries.map(e => ({ key: e.key, label: e.label }))
        const allKeys = columns.map(c => c.key)
        picker.columns = columns
        picker.defaultSelected = defaultSelected.length ? defaultSelected.slice() : allKeys
        picker.range = range
        picker.entries = entries.slice()
        picker.hash = hashColumnSet(allKeys)
        picker.showReset = !!getPreset(opts.getTableName(), picker.hash)
        picker.copyHeader = copyHeader
        picker.visible = true
    }

    async function onPickerConfirm(payload: { selectedKeys: string[]; remember: boolean; copyHeader: boolean }): Promise<void> {
        picker.visible = false
        const range = picker.range
        if (!range) return
        const effective = picker.entries.filter(e => payload.selectedKeys.includes(e.key))
        if (!effective.length) return

        const tsv = buildTSV(range, effective, opts.getRows(), buildOptions(payload.copyHeader))
        const ok = await writeClipboard(tsv)
        if (ok) {
            if (payload.remember && picker.hash) {
                savePreset(opts.getTableName(), picker.hash, payload.selectedKeys, picker.entries.map(e => e.key), payload.copyHeader)
            }
            opts.toastSuccess(MSG.copied)
        } else {
            opts.toastError(MSG.copyFailed)
        }
    }

    function onPickerCancel(): void {
        picker.visible = false
        picker.range = null
    }

    function onPickerReset(): void {
        if (picker.hash) deletePreset(opts.getTableName(), picker.hash)
        picker.visible = false
        picker.showReset = false
        opts.toastWarning(MSG.presetReset)
    }

    return {
        picker,
        handleCopyShortcut,
        handleSettings,
        onPickerConfirm,
        onPickerCancel,
        onPickerReset
    }
}
