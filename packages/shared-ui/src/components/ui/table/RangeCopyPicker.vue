<script setup lang="ts">
// Column picker shown when an Excel-like copy needs the user to choose which
// columns to copy (multi-field columns with no saved preset). Built from the
// shared-ui Dialog/Checkbox/Button primitives. Vietnamese labels (no i18n).
import { computed, ref } from "vue"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../dialog"
import { Checkbox } from "../checkbox"
import { Button } from "../button"
import { Label } from "../label"

interface PickerColumn {
    key: string
    label: string
}

const props = withDefaults(
    defineProps<{
        columns: PickerColumn[]
        defaultSelected?: string[]
        defaultRemember?: boolean
        defaultCopyHeader?: boolean
        rowCount?: number
        showResetButton?: boolean
    }>(),
    {
        defaultSelected: () => [],
        defaultRemember: false,
        defaultCopyHeader: false,
        rowCount: 0,
        showResetButton: false
    }
)

const emit = defineEmits<{
    (e: "confirm", payload: { selectedKeys: string[]; remember: boolean; copyHeader: boolean }): void
    (e: "cancel"): void
    (e: "reset"): void
}>()

// v-model:open for the Dialog — closing via overlay/esc is treated as cancel.
const open = ref(true)

const selected = ref<Set<string>>(new Set(props.defaultSelected.length ? props.defaultSelected : props.columns.map(c => c.key)))
const remember = ref(props.defaultRemember)
const copyHeader = ref(props.defaultCopyHeader)

const isAllSelected = computed(() => props.columns.length > 0 && selected.value.size === props.columns.length)
const canCopy = computed(() => selected.value.size > 0)

function toggle(key: string, checked: boolean) {
    const next = new Set(selected.value)
    if (checked) next.add(key)
    else next.delete(key)
    selected.value = next
}

function toggleAll(checked: boolean) {
    selected.value = checked ? new Set(props.columns.map(c => c.key)) : new Set()
}

function confirm() {
    if (!canCopy.value) return
    emit("confirm", { selectedKeys: Array.from(selected.value), remember: remember.value, copyHeader: copyHeader.value })
}

function onOpenChange(v: boolean) {
    open.value = v
    if (!v) emit("cancel")
}
</script>

<template>
    <Dialog :open="open" @update:open="onOpenChange">
        <DialogContent class="range-copy-picker max-w-[420px]">
            <DialogHeader>
                <DialogTitle>Sao chép cột</DialogTitle>
            </DialogHeader>

            <div class="flex flex-col gap-1 py-1">
                <Label class="flex items-center gap-2 border-b border-dashed pb-2 mb-1 cursor-pointer text-muted-foreground">
                    <Checkbox :model-value="isAllSelected" @update:model-value="toggleAll(!!$event)" />
                    <span>{{ isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả" }}</span>
                </Label>
                <ul class="max-h-[40vh] overflow-y-auto flex flex-col gap-0.5">
                    <li v-for="col in columns" :key="col.key">
                        <Label class="flex items-center gap-2 py-1 cursor-pointer">
                            <Checkbox :model-value="selected.has(col.key)" @update:model-value="toggle(col.key, !!$event)" />
                            <span class="truncate">{{ col.label || col.key }}</span>
                        </Label>
                    </li>
                </ul>
            </div>

            <DialogFooter class="flex-col gap-2 sm:flex-col sm:items-stretch">
                <Label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox :model-value="copyHeader" @update:model-value="copyHeader = !!$event" />
                    <span>Sao chép tiêu đề cột</span>
                </Label>
                <Label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox :model-value="remember" @update:model-value="remember = !!$event" />
                    <span>Ghi nhớ lựa chọn cho lần sau</span>
                </Label>
                <div class="flex items-center justify-end gap-2 pt-1">
                    <Button v-if="showResetButton" variant="ghost" class="mr-auto text-destructive" @click="emit('reset')">Xoá ghi nhớ</Button>
                    <Button variant="outline" @click="onOpenChange(false)">Huỷ</Button>
                    <Button :disabled="!canCopy" @click="confirm">Sao chép</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
