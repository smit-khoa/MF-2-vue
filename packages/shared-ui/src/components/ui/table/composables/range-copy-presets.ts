// Copy-preset persistence for Excel-like range copy.
//
// A "preset" remembers which sub-columns a user chose to copy for a given set
// of columns, keyed by a deterministic hash of the column-key set. Presets are
// scoped per table (localStorage key `range_copy_presets_<tableName>`) and
// capped LRU-style so the store never grows unbounded.

import type { CopyEntry } from "./use-range-copy"

// LRU cap for presets per table (localStorage hygiene)
export const COPY_PRESET_CAP = 50

const STORAGE_PREFIX = "range_copy_presets_"

export interface CopyPreset {
    selectedKeys: string[]
    allKeys: string[]
    copyHeader: boolean
    savedAt: number
}

export type PresetMap = Record<string, CopyPreset>

// Deterministic hash of a column-key set. Order-independent so the same set of
// columns always maps to the same preset regardless of selection order.
export function hashColumnSet(keys: string[]): string {
    if (!Array.isArray(keys) || !keys.length) return ""
    return keys.slice().sort().join("|")
}

function storageKey(tableName: string): string {
    return `${STORAGE_PREFIX}${tableName}`
}

export function getPresets(tableName: string): PresetMap {
    try {
        const raw = localStorage.getItem(storageKey(tableName))
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
        return {}
    }
}

export function getPreset(tableName: string, hash: string): CopyPreset | null {
    if (!hash) return null
    return getPresets(tableName)[hash] ?? null
}

export function savePreset(tableName: string, hash: string, selectedKeys: string[], allKeys: string[], copyHeader: boolean): void {
    if (!hash) return
    try {
        const presets = getPresets(tableName)
        presets[hash] = {
            selectedKeys: selectedKeys.slice(),
            allKeys: Array.isArray(allKeys) ? allKeys.slice() : selectedKeys.slice(),
            copyHeader: !!copyHeader,
            savedAt: Date.now()
        }
        // LRU evict oldest if over cap
        const keys = Object.keys(presets)
        if (keys.length > COPY_PRESET_CAP) {
            const sorted = keys.map(k => ({ k, savedAt: presets[k]?.savedAt ?? 0 })).sort((a, b) => a.savedAt - b.savedAt)
            const toRemove = sorted.slice(0, keys.length - COPY_PRESET_CAP)
            toRemove.forEach(x => delete presets[x.k])
        }
        localStorage.setItem(storageKey(tableName), JSON.stringify(presets))
    } catch {
        // silent — copy still succeeds without the saved preset
    }
}

export function deletePreset(tableName: string, hash: string): void {
    if (!hash) return
    try {
        const presets = getPresets(tableName)
        if (!presets[hash]) return
        delete presets[hash]
        localStorage.setItem(storageKey(tableName), JSON.stringify(presets))
    } catch {
        // silent
    }
}

// Column-aware subset match. Each column (grouped by parentKey) is "covered"
// when at least ONE of its sub-field keys appears in preset.selectedKeys.
// Prefer the newest preset when multiple match.
export function findSubsetPresetByColumn(entries: CopyEntry[], presets: PresetMap): CopyPreset | null {
    if (!Array.isArray(entries) || !entries.length) return null

    const columnSubKeys: Record<string, string[]> = {}
    entries.forEach(e => {
        const parent = e.parentKey || e.key
        if (!columnSubKeys[parent]) columnSubKeys[parent] = []
        columnSubKeys[parent].push(e.key)
    })
    const columns = Object.keys(columnSubKeys)

    let best: CopyPreset | null = null
    let bestTs = -1
    Object.keys(presets).forEach(h => {
        const p = presets[h]
        if (!p || !Array.isArray(p.selectedKeys) || !p.selectedKeys.length) return
        const saved = new Set(p.selectedKeys)
        const allCovered = columns.every(parent => (columnSubKeys[parent] ?? []).some(k => saved.has(k)))
        if (allCovered && (p.savedAt || 0) > bestTs) {
            best = p
            bestTs = p.savedAt || 0
        }
    })
    return best
}

// Smart default for the picker: remember tick/untick decisions across ranges.
//  - key ever ticked in any preset → default tick
//  - key shown (in allKeys) but never ticked → default untick (user removed it)
//  - key never seen → default tick
export function computePickerDefault(entries: CopyEntry[], presets: PresetMap): string[] {
    const everTicked = new Set<string>()
    const everShown = new Set<string>()
    Object.values(presets).forEach(p => {
        if (!p) return
        if (Array.isArray(p.selectedKeys)) {
            p.selectedKeys.forEach(k => {
                everTicked.add(k)
                everShown.add(k)
            })
        }
        if (Array.isArray(p.allKeys)) p.allKeys.forEach(k => everShown.add(k))
    })
    return entries
        .filter(e => {
            if (everTicked.has(e.key)) return true
            if (everShown.has(e.key)) return false
            return true
        })
        .map(e => e.key)
}
