<template>
    <div class="data-grid-container" :class="{ 'fullscreen-mode': isFullscreen }">
        <!-- Toolbar -->
        <div v-if="showToolbar" class="flex justify-end gap-[12px] p-[10px]">
            <!-- refresh -->
            <Button variant="secondary" size="icon" v-if="tools.includes('refresh')" @click="refreshData"><Icon name="restart" size="18" /></Button>

            <!-- thời gian -->
            <Button variant="secondary"><Icon name="calendar" size="18" /> Thời gian </Button>

            <!-- bộ lọc -->
            <Button variant="secondary"><Icon name="filter" size="18" /> Bộ lọc </Button>

            <!-- tải xuống -->
            <Button variant="secondary"><Icon name="download" size="18" /> Tải xuống </Button>

            <!-- tuỳ chỉnh cột  -->
            <CustomColumn v-if="tools.includes('custom-column')" :allColumns="allColumns" :frozenOrder="frozenOrder" :visibleColumns="visibleColumns" :rowGroups="rowGroups" @apply-column-settings="applyColumnSettings1" />

            <!-- zoom -->
            <Button variant="secondary" v-if="tools.includes('zoom')" @click="toggleFullscreen"><Icon name="zoom" size="18" /> {{ isFullscreen ? "Thu nhỏ" : "Zoom" }}</Button>
        </div>

        <!-- <div class="data-grid-content p-[20px]"> -->
        <div class="flex overflow-hidden w-full flex-1" :class="isBorder && 'border-[var(--border-table)] rounded-[16px] border-[1px]'">
            <div class="flex flex-1 flex-col overflow-x-auto position-relative">
                <!-- table -->
                <div class="flex flex-1 flex-col overflow-y-auto position-relative">
                    <div class="data-grid-main" ref="dataGridMain" :class="{ 'with-sidebar': groupMode && tools.includes('group') }" @scroll="handleMainScroll">
                        <!-- Header Container -->
                        <div
                            class="header-row"
                            :style="{
                                minWidth: totalTableWidth + 'px',
                                minHeight: '50px'
                            }">
                            <!-- check all -->
                            <label v-if="showCheckbox" class="header-cell checkbox-cell frozen-column cursor-pointer" style="width: 60px; left: 0px; z-index: 100">
                                <Checkbox v-model="isAllSelected" :disabled="loading" @update:model-value="toggleSelectAll" />
                            </label>

                            <!-- Frozen columns -->
                            <div
                                v-for="column in frozenColumns"
                                :key="`header-frozen-${column.field}`"
                                class="header-cell"
                                :class="[
                                    { 'frozen-column': column.frozen },
                                    {
                                        'last-frozen-column': column.frozen && lastFrozenColumn?.field === column.field,
                                        'show-shadow': isScrollingHorizontally,
                                        'range-col-handle': rangeSelectActive
                                    },
                                    column.position ? `cell-align-${column.position}` : '',
                                    headerRangeClass(column.field)
                                ]"
                                :data-field="column.field"
                                @mousedown="rangeSelectActive && onRangeHeaderMouseDown($event, column.field)"
                                :style="{
                                    width: getColumnWidth(column.field) + 'px',
                                    minWidth: getColumnWidth(column.field) + 'px',
                                    left: column.frozen ? getFrozenColumnLeft(column.field, 'header', null) + 'px' : undefined,
                                    zIndex: column.frozen ? 100 : 1,
                                    position: column.frozen ? 'sticky' : undefined
                                }">
                                <span>{{ column.name }}</span>
                                <DropdownMenu @update:open="open => (colOpenOption = open ? column.field : null)">
                                    <DropdownMenuTrigger as-child>
                                        <div class="w-[20px] h-[20px] flex items-center justify-center hover:bg-[var(--button-secondary-bg-hover)] duration-300 rounded-[8px] header-option" :class="colOpenOption === column.field && 'bg-[var(--button-secondary-bg-hover)] !opacity-100'">
                                            <Icon name="more-vertical" size="18" />
                                        </div>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem :disabled="!(showFrozenControls && !pivotMode && canShowFreezeButton(column.field))" @click="toggleFreeze(column.field)">{{ column.frozen ? "Bỏ đóng băng cột" : "Đóng băng cột này" }}</DropdownMenuItem>
                                        <DropdownMenuItem @click="toggleSort(column.field, 'asc')">Sắp xếp từ A - Z</DropdownMenuItem>
                                        <DropdownMenuItem @click="toggleSort(column.field, 'desc')">Sắp xếp từ Z - A</DropdownMenuItem>
                                        <DropdownMenuItem @click="toggleSort(column.field, 'default')">Sắp xếp mặc định</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div v-if="showColumnResize" class="column-resizer" @mousedown="startResize($event, column)" @dblclick="resetColumnWidth(column)"></div>
                            </div>

                            <!-- VIRTUALIZED Non-Frozen Column Headers -->
                            <div
                                v-for="vCol in virtualNonFrozenColumns"
                                :key="`header-virtual-${vCol.field}`"
                                class="header-cell non-frozen-cell"
                                :class="[vCol.position ? `cell-align-${vCol.position}` : '', { 'range-col-handle': rangeSelectActive }, headerRangeClass(vCol.field)]"
                                :data-field="vCol.field"
                                @mousedown="rangeSelectActive && onRangeHeaderMouseDown($event, vCol.field)"
                                :style="{
                                    width: vCol.width + 'px',
                                    transform: `translateX(${vCol.left}px)`
                                }">
                                <span>{{ vCol.name }}</span>

                                <DropdownMenu @update:open="open => (colOpenOption = open ? vCol.field : null)">
                                    <DropdownMenuTrigger as-child>
                                        <div class="w-[20px] h-[20px] flex items-center justify-center hover:bg-[var(--button-secondary-bg-hover)] duration-300 rounded-[8px] header-option" :class="colOpenOption === vCol.field && 'bg-[var(--button-secondary-bg-hover)] !opacity-100'">
                                            <Icon name="more-vertical" size="18" />
                                        </div>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem :disabled="!(showFrozenControls && !pivotMode && canShowFreezeButton(vCol.field))" @click="toggleFreeze(vCol.field)">{{ vCol.frozen ? "Bỏ đóng băng cột" : "Đóng băng cột này" }}</DropdownMenuItem>
                                        <DropdownMenuItem @click="toggleSort(vCol.field, 'asc')">Sắp xếp từ A - Z</DropdownMenuItem>
                                        <DropdownMenuItem @click="toggleSort(vCol.field, 'desc')">Sắp xếp từ Z - A</DropdownMenuItem>
                                        <DropdownMenuItem @click="toggleSort(vCol.field, 'default')">Sắp xếp mặc định</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div v-if="showColumnResize" class="column-resizer" @mousedown="startResize($event, vCol)" @dblclick="resetColumnWidth(vCol)"></div>
                            </div>
                            <!-- Cell trống lấp đầy header, dùng absolute -->
                            <div
                                v-if="emptySpaceWidth > 0"
                                class="header-cell empty-space-cell header-empty-absolute"
                                :style="{
                                    position: 'absolute',
                                    left: totalTableWidth + 'px',
                                    top: 0,
                                    bottom: 0,
                                    width: emptySpaceWidth + 'px',
                                    minWidth: emptySpaceWidth + 'px',
                                    zIndex: 1
                                }" />
                        </div>

                        <!-- Thanh preview resize màu xanh -->
                        <div
                            v-if="isResizing"
                            class="resize-preview-line"
                            :style="{
                                left: previewPosition + 'px',
                                height: virtualHeightFinal + rowHeight + 'px'
                            }" />

                        <!-- Body Container -->
                        <div
                            class="grid-body"
                            ref="gridBody"
                            @scroll.passive="handleScroll"
                            @mousedown="rangeSelectActive && rangeSelection.onBodyMouseDown($event)"
                            :style="{
                                minWidth: totalTableWidth + 'px',
                                ...(rangeSelection.state.isDragging ? { userSelect: 'none' } : {})
                            }">
                            <div
                                class="grid-content"
                                :style="{
                                    height: virtualHeightFinal + 'px',
                                    minWidth: totalTableWidth + 'px'
                                }">
                                <div
                                    v-for="(row, index) in visibleRows"
                                    :key="getRowKey(row, startIndex + index)"
                                    :class="['grid-row', pivotMode && row.isSummary && 'pivot-summary-row', !pivotMode && props.stripe && (startIndex + index) % 2 === 1 ? 'row-odd' : 'row-even', pivotMode && 'border-top-none', !row.data && 'group-row']"
                                    :data-level="row.level || 1"
                                    :style="{
                                        transform: `translateY(${rowPositionsWithSpacing[startIndex + index] || (startIndex + index) * rowHeight}px)`,
                                        position: 'absolute',
                                        width: '100%',
                                        minWidth: totalTableWidth + 'px',
                                        height: props.enableDynamicRowHeight ? getRowHeight(row, startIndex + index) + 'px' : rowHeight + 'px'
                                    }">
                                    <!-- phần border trái group -->
                                    <template v-if="hasGrouping">
                                        <div v-for="(ope, index) in row.level" :key="index" class="border-l-group w-[20px] min-w-[20px] h-full bg-background sticky z-10" :style="{ left: index * 20 + 'px' }">
                                            <div :class="`w-[20px] h-[${row.isFinalGroup ? (row.endGroups && !row.endGroups.includes(index) ? (row.level - index) * 20 + 50 + index * GROUP_SPACING : (row.level - index) * 20 + 50) : 50 + GROUP_SPACING}px] bg-background`">
                                                <div
                                                    class="w-full h-full border-left-start-group"
                                                    :style="
                                                        row.isFinalGroup && row.endGroups && row.endGroups.includes(index)
                                                            ? {
                                                                  borderLeft: '1px solid var(--border)',
                                                                  borderBottom: '1px solid var(--border)',
                                                                  borderBottomLeftRadius: '12px'
                                                              }
                                                            : {
                                                                  borderLeft: '1px solid var(--border)'
                                                              }
                                                    "></div>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- checkbox -->
                                    <label
                                        v-if="showCheckbox && row.data"
                                        class="row-cell checkbox-cell frozen-column cursor-pointer"
                                        :class="index === 0 && 'border-top-none'"
                                        :style="[
                                            'width: 60px; left: 0px; z-index: 100',
                                            {
                                                borderLeft: '1px solid var(--border)',
                                                left: rowGroups.length ? row.level * 20 + 'px' : '0px',
                                                borderBottom: row.isFinalGroup ? '1px solid var(--border)' : ''
                                            }
                                        ]">
                                        <!-- check row -->
                                        <Checkbox v-if="row.data" :model-value="props.checkedConfig.selected.includes(String(row.data[props.table_info.key_id]))" :value="String(row.data[props.table_info.key_id])" :disabled="loading" @update:model-value="toggleRowSelection1(String(row.data[props.table_info.key_id]))" />
                                    </label>

                                    <!-- bảng thường -->
                                    <template v-if="!pivotMode">
                                        <!-- phần toggle group -->
                                        <template v-if="!row.data">
                                            <!-- border left của group -->
                                            <div class="border-l-group w-[20px] min-w-[20px] h-full bg-background sticky z-10" :style="{ left: row.level * 20 + 'px' }">
                                                <div
                                                    class="h-full w-full"
                                                    :style="[
                                                        {
                                                            borderLeft: '1px solid var(--border)',
                                                            borderTop: '1px solid var(--border)',
                                                            borderTopLeftRadius: '12px'
                                                        },
                                                        !expandedGroups.has(row.id) && {
                                                            borderBottom: '1px solid var(--border)',
                                                            borderBottomLeftRadius: '12px'
                                                        }
                                                    ]"></div>
                                            </div>
                                            <div
                                                class="row-cell group-cell-full"
                                                :class="{ 'show-shadow': isScrollingHorizontally }"
                                                :style="{
                                                    overflow: 'visible',
                                                    position: 'sticky',
                                                    width: totalTableWidth - row.level * 40 - 40 + 'px',
                                                    minWidth: totalTableWidth - row.level * 40 - 40 + 'px',
                                                    left: row.level * 20 + 'px',
                                                    top: 0,
                                                    zIndex: 10,
                                                    background: getCellBackground(row, {}, startIndex + index),
                                                    borderTop: 'none'
                                                }"
                                                @click="toggleGroup(row.id)">
                                                <div
                                                    class="group-content sticky left-0"
                                                    :style="[
                                                        emptySpaceWidth <= 0 && {
                                                            borderTop: '1px solid var(--border)',
                                                            borderBottom: !expandedGroups.has(row.id) ? '1px solid var(--border)' : ''
                                                        },
                                                        {
                                                            width: viewportWidth - row.level * 40 - 40 + 'px',
                                                            minWidth: viewportWidth - row.level * 40 - 40 + 'px',
                                                            left: (row.level + 1) * 20 + 'px'
                                                        }
                                                    ]">
                                                    <Icon name="chevron-right" :class="`duration-300 rotate-${expandedGroups.has(row.id) ? 90 : 0}`" size="14" />
                                                    <span class="group-label">{{ row.title }} ({{ row.count }})</span>
                                                </div>
                                            </div>

                                            <!-- border right của group -->
                                            <div
                                                class="border-r-group w-[20px] min-w-[20px] h-full bg-background sticky z-[-1]"
                                                :style="[
                                                    {
                                                        left: row.level * 20 + 'px',
                                                        borderRight: '1px solid var(--border)',
                                                        borderTop: '1px solid var(--border)',
                                                        borderTopRightRadius: '12px'
                                                    },
                                                    !expandedGroups.has(row.id)
                                                        ? {
                                                              borderBottom: '1px solid var(--border)',
                                                              borderBottomRightRadius: '12px'
                                                          }
                                                        : {}
                                                ]"></div>
                                        </template>

                                        <!-- Regular data rows -->
                                        <template v-else>
                                            <!-- cột đóng băng -->
                                            <div
                                                v-for="column in frozenColumns"
                                                :key="`cell-frozen-${row.data?.id}-${column.field}`"
                                                class="row-cell"
                                                :class="[
                                                    row.data && row.data.id !== undefined ? cellColorMap[row.data.id]?.[column.field] || '' : '',
                                                    {
                                                        'last-frozen-column': column.frozen && lastFrozenColumn?.field === column.field,
                                                        'show-shadow': isScrollingHorizontally,
                                                        'frozen-column': column.frozen
                                                    },
                                                    `cell-align-${column.position}`,
                                                    index === 0 && 'border-top-none',
                                                    rangeCellClass(startIndex + index, column.field)
                                                ]"
                                                :style="{
                                                    width: column.index === 0 && hasGrouping ? getColumnWidth(column.field) - row.level * 20 + 'px' : getColumnWidth(column.field) + 'px',
                                                    minWidth: column.index === 0 && hasGrouping ? getColumnWidth(column.field) - row.level * 20 + 'px' : getColumnWidth(column.field) + 'px',
                                                    left: column.frozen ? getFrozenColumnLeft(column.field, 'body', row.level, column.index) + 'px' : undefined,
                                                    zIndex: column.frozen ? 100 : 1,
                                                    position: column.frozen ? 'sticky' : undefined,
                                                    background: getCellBackground(row, column, startIndex + index),
                                                    borderBottom: row.isFinalGroup ? '1px solid var(--border)' : ''
                                                }">
                                                <Skeleton v-if="loading || row.loading || column.loading" class="h-4 w-2/3" />

                                                <!-- Regular data row with indent for first grouped column -->
                                                <div v-else-if="row.data && column.field === rowGroups[0] && rowGroups.length > 0" class="data-row-content">
                                                    <slot :name="column.field" :row="row.data" :value="row.data[column.field]" :column="column.field" :index="startIndex + index">
                                                        <span class="fs-13 fw-500">{{ row.data[column.field] }}</span>
                                                    </slot>
                                                </div>

                                                <!-- Regular data row -->
                                                <slot v-else-if="row.data" :name="column.field" :row="row.data" :value="row.data[column.field]" :column="column.field" :index="startIndex + index">
                                                    <span class="fs-13 fw-500">{{ row.data[column.field] }}</span>
                                                </slot>
                                            </div>

                                            <!-- cột không đóng băng -->
                                            <div
                                                v-for="(vCol, indexCol) in virtualNonFrozenColumns"
                                                :key="`cell-virtual-${row.data?.id}-${vCol.field}`"
                                                class="row-cell non-frozen-cell"
                                                :class="[vCol.position && `cell-align-${vCol.position}`, index === 0 && 'border-top-none', rangeCellClass(startIndex + index, vCol.field)]"
                                                :style="{
                                                    width: (!virtualNonFrozenColumns[indexCol + 1] && hasGrouping ? vCol.width - row.level * 20 : vCol.width) + 'px',
                                                    transform: `translateX(${vCol.left}px)`,
                                                    background: getCellBackground(row, vCol, startIndex + index),
                                                    borderBottom: row.isFinalGroup ? '1px solid var(--border)' : ''
                                                }">
                                                <Skeleton v-if="loading || row.loading || vCol.loading" class="h-4 w-2/3" />

                                                <!-- Regular data row with indent for first grouped column -->
                                                <div v-else-if="row.data && vCol.field === rowGroups[0] && rowGroups.length > 0" class="data-row-content" :style="{ paddingLeft: row.level * 12 + 'px' }">
                                                    <slot :name="vCol.field" :row="row.data" :value="row.data[vCol.field]" :column="vCol.field" :index="startIndex + index">
                                                        <span class="fs-13 fw-500">{{ row.data[vCol.field] }}</span>
                                                    </slot>
                                                </div>

                                                <!-- Regular data row -->
                                                <slot v-else-if="row.data" :name="vCol.field" :row="row.data" :value="row.data[vCol.field]" :column="vCol.field" :index="startIndex + index">
                                                    <span class="fs-13 fw-500">{{ row.data[vCol.field] }}</span>
                                                </slot>
                                            </div>
                                        </template>
                                    </template>

                                    <!-- pivot -->
                                    <template v-else>
                                        <div
                                            v-for="column in visibleColumns"
                                            :key="`cell-${row.id}-${column.field}`"
                                            class="row-cell"
                                            :class="[row.data && row.data.id !== undefined ? cellColorMap[row.data.id]?.[column.field] || '' : '', { 'frozen-column': column.frozen }, `cell-align-${column.position || 'left'}`, props.column_pivot.dimensions.includes(column.field) && !row[column.field] && 'border-top-none']"
                                            :style="{
                                                width: getColumnWidth(column.field) + 'px',
                                                minWidth: getColumnWidth(column.field) + 'px',
                                                left: column.frozen ? getFrozenColumnLeft(column.field, 'body', null) + 'px' : undefined,
                                                zIndex: column.frozen ? 100 : 1,
                                                position: column.frozen ? 'sticky' : undefined,
                                                background: getCellBackground(row, column, startIndex + index)
                                            }">
                                            <div class="pivot-cell-content">
                                                <Skeleton v-if="loading || row.loading || column.loading" class="h-4 w-2/3" />
                                                <template v-else>
                                                    <!-- Chỉ áp dụng thụt lề và icon cho cột dimension đầu tiên -->
                                                    <template v-if="column.field === props.column_pivot.dimensions[0]">
                                                        <!-- <span v-if="row.isSummary" class="pivot-toggle-icon" :class="{ expanded: expandedPivotRows.has(row.id) }" @click.stop="togglePivotRow(row.id)"> ▶ </span> -->
                                                        <span>{{ formatPivotCellValue(row, column.field) }}</span>
                                                    </template>
                                                    <!-- Các cột khác hiển thị bình thường -->
                                                    <template v-else>
                                                        <span class="fs-13 fw-500">{{ formatPivotCellValue(row, column.field) }}</span>
                                                    </template>
                                                </template>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- phần border phải group -->
                                    <div
                                        v-if="hasGrouping"
                                        class="sticky z-[-1] flex"
                                        :style="{
                                            left: totalTableWidth - row.level * 20 + 'px'
                                        }">
                                        <div v-for="(ope, index) in row.level" :key="index" class="border-l-group w-[20px] min-w-[20px] h-full bg-background justify-items-end">
                                            <div :class="`w-[${20}px] h-[${row.isFinalGroup ? (row.endGroups && !row.endGroups.includes(ope) ? ope * 20 + 50 : ope * 20 + 50) : 50 + GROUP_SPACING}px] bg-background`" :style="[index + 1 === row.level && 'display: none']">
                                                <div
                                                    class="w-full h-full bg-background border-right-end-group relative"
                                                    :style="[
                                                        row.isFinalGroup && checkEndGroup(row, index)
                                                            ? {
                                                                  borderRight: '1px solid var(--border)',
                                                                  borderBottom: '1px solid var(--border)',
                                                                  borderBottomRightRadius: '12px'
                                                              }
                                                            : {
                                                                  borderRight: '1px solid var(--border)'
                                                              }
                                                    ]" />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Cell trống lấp đầy body -->
                                    <div
                                        v-if="emptySpaceWidth > 0 && !hasGrouping"
                                        class="row-cell empty-space-cell"
                                        :style="{
                                            position: 'absolute',
                                            left: totalTableWidth + 'px',
                                            top: 0,
                                            bottom: 0,
                                            width: emptySpaceWidth + 'px',
                                            minWidth: emptySpaceWidth + 'px',
                                            background: getCellBackground(row, {}, startIndex + index)
                                        }" />
                                </div>

                                <!-- Range-select highlight is painted onto cells via the `range-cell`
                                     class (style.css !important-overrides the inline getCellBackground
                                     colour), so frozen cells stay pinned while scrolling. Only the
                                     floating copy/settings buttons remain as an overlay element. -->
                                <template v-if="rangeSelectActive && rangeSelection.state.ranges.length">
                                    <div
                                        v-if="rangeSelection.actionsAnchor.value"
                                        class="range-actions"
                                        :style="{
                                            top: rangeSelection.actionsAnchor.value.top + 'px',
                                            left: rangeSelection.actionsAnchor.value.left + 'px'
                                        }">
                                        <button type="button" class="range-actions__btn" title="Sao chép" @mousedown.stop @click.stop="rangeCopyFlow.handleCopyShortcut()">
                                            <Icon name="copy" size="16" />
                                        </button>
                                        <button type="button" class="range-actions__btn" title="Tuỳ chọn cột" @mousedown.stop @click.stop="rangeCopyFlow.handleSettings()">
                                            <Icon name="settings" size="16" />
                                        </button>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <!-- Footer tổng giá trị các cột, đặt cùng cấp với .grid-content -->
                        <div class="grid-footer-sum" v-if="showTotal" :style="{ minWidth: totalTableWidth + 'px' }">
                            <div
                                v-if="showCheckbox"
                                class="footer-cell checkbox-cell frozen-column"
                                :class="{
                                    'frozen-column': visibleColumns.length > 0 && visibleColumns[0]?.frozen
                                }"
                                style="width: 60px"
                                :style="visibleColumns.length > 0 && visibleColumns[0]?.frozen ? { left: '0px', zIndex: 100 } : {}"></div>
                            <!-- Frozen footer cells -->
                            <div
                                v-for="col in frozenColumns"
                                :key="`footer-frozen-${col.field}`"
                                class="footer-cell"
                                :class="[
                                    { 'frozen-column': col.frozen },
                                    {
                                        'last-frozen-column': col.frozen && lastFrozenColumn?.field === col.field,
                                        'show-shadow': isScrollingHorizontally
                                    },
                                    col.position ? `cell-align-${col.position}` : ''
                                ]"
                                :style="{
                                    width: getColumnWidth(col.field) + 'px',
                                    minWidth: getColumnWidth(col.field) + 'px',
                                    left: col.frozen ? getFrozenColumnLeft(col.field, 'footer', null) + 'px' : undefined,
                                    zIndex: col.frozen ? 100 : 1
                                }">
                                <span class="footer-text" v-if="typeof columnSums[col.field] === 'number'">{{ columnSums[col.field]?.toLocaleString() }}</span>
                                <span class="footer-text" v-else></span>
                            </div>
                            <!-- Virtual footer cells -->
                            <div
                                v-for="vCol in virtualNonFrozenColumns"
                                :key="`footer-virtual-${vCol.field}`"
                                class="footer-cell non-frozen-cell"
                                :class="[vCol.position ? `cell-align-${vCol.position}` : '']"
                                :style="{
                                    width: vCol.width + 'px',
                                    transform: `translateX(${vCol.left}px)`
                                }">
                                <span class="footer-text" v-if="typeof columnSums[vCol.field] === 'number'">{{ columnSums[vCol.field]?.toLocaleString() }}</span>
                                <span class="footer-text" v-else></span>
                            </div>
                            <!-- Empty space cell for footer -->
                            <div
                                v-if="emptySpaceWidth > 0"
                                class="footer-cell empty-space-cell"
                                :style="{
                                    position: 'absolute',
                                    left: totalTableWidth + 'px',
                                    top: 0,
                                    bottom: 0,
                                    width: emptySpaceWidth + 'px',
                                    minWidth: emptySpaceWidth + 'px',
                                    zIndex: 1
                                }"></div>
                        </div>
                    </div>
                </div>

                <!-- Paging -->
                <Paging :paging="paging" @changePage="changePaging" text="Rows" />
            </div>
        </div>
        <!-- </div> -->

        <!-- Modal tùy chỉnh cột pivot -->
        <div v-if="showPivotColumnSettings" class="column-settings-modal">
            <div class="popup-columns">
                <div class="left">
                    <div class="left-title">Tất cả cột pivot</div>
                    <div class="column-list-scroll">
                        <!-- Dimensions -->
                        <div class="pivot-section">
                            <div class="pivot-section-title">📊 Dimensions</div>
                            <div v-for="dimension in availablePivotDimensions" :key="dimension" class="column-checkbox-item">
                                <div class="checkbox-label">
                                    <Checkbox :id="`${dimension}-checkbox`" :model-value="selectedPivotDimensions.includes(dimension)" @update:model-value="handlePivotDimensionCheckboxChange(Boolean($event), dimension)" />
                                    <Label :for="`${dimension}-checkbox`">{{ getFieldLabel(dimension) }}</Label>
                                </div>
                            </div>
                        </div>

                        <!-- Metrics -->
                        <div class="pivot-section">
                            <div class="pivot-section-title">📈 Metrics</div>
                            <div v-for="metric in availablePivotMetrics" :key="metric" class="column-checkbox-item">
                                <div class="checkbox-label">
                                    <Checkbox :id="`${metric}-checkbox`" :model-value="selectedPivotMetrics.includes(metric)" @update:model-value="handlePivotMetricCheckboxChange(Boolean($event), metric)" />
                                    <Label :for="`${metric}-checkbox`">{{ getFieldLabel(metric) }}</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="right">
                    <div class="right-title">
                        Đã chọn
                        {{ selectedPivotDimensions.length + selectedPivotMetrics.length }}
                        cột
                    </div>
                    <div class="pivot-selected-wrap">
                        <!-- Selected Dimensions -->
                        <div class="pivot-selected-section">
                            <div class="pivot-selected-title">📊 Dimensions đã chọn ({{ selectedPivotDimensions.length }})</div>
                            <div class="pivot-selected-list">
                                <div v-for="dimension in pivotDimensionsOrder" :key="dimension" class="selected-pivot-item">
                                    <span>{{ getFieldLabel(dimension) }}</span>
                                    <button class="remove-btn" @click="deletePivotDimension(dimension)">×</button>
                                </div>
                            </div>
                        </div>

                        <!-- Selected Metrics -->
                        <div class="pivot-selected-section">
                            <div class="pivot-selected-title">📈 Metrics đã chọn ({{ selectedPivotMetrics.length }})</div>
                            <div class="pivot-selected-list">
                                <div v-for="metric in pivotMetricsOrder" :key="metric" class="selected-pivot-item">
                                    <span>{{ getFieldLabel(metric) }}</span>
                                    <button
                                        class="remove-btn"
                                        @click="
                                            () => {
                                                selectedPivotMetrics = selectedPivotMetrics.filter(m => m !== metric)
                                                pivotMetricsOrder = pivotMetricsOrder.filter(m => m !== metric)
                                            }
                                        ">
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="column-settings-actions">
                <button @click="applyPivotColumnSettings" class="apply-btn">Áp dụng</button>
                <button @click="showPivotColumnSettings = false" class="cancel-btn">Hủy</button>
            </div>
        </div>

        <!-- Range-copy column picker (opens when a copy needs column selection) -->
        <RangeCopyPicker
            v-if="rangeCopyFlow.picker.visible"
            :columns="rangeCopyFlow.picker.columns"
            :default-selected="rangeCopyFlow.picker.defaultSelected"
            :default-copy-header="rangeCopyFlow.picker.copyHeader"
            :default-remember="rangeCopyFlow.picker.showReset"
            :row-count="rangeCopyFlow.picker.range ? rangeCopyFlow.picker.range.rowEnd - rangeCopyFlow.picker.range.rowStart + 1 : 0"
            :show-reset-button="rangeCopyFlow.picker.showReset"
            @confirm="rangeCopyFlow.onPickerConfirm"
            @cancel="rangeCopyFlow.onPickerCancel"
            @reset="rangeCopyFlow.onPickerReset" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted, onBeforeMount } from "vue"
import "./style.css"
import Paging from "./Pagination.vue"
import { Label } from "../label"
import { Checkbox } from "../checkbox"
import { Skeleton } from "../skeleton"
import { Button } from "../button"
import CustomColumn from "./CustomColumn.vue"
import { Icon } from "../../../icons"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "../dropdown-menu"
import { toast } from "../sonner"
import RangeCopyPicker from "./RangeCopyPicker.vue"
import { useTableRangeSelection } from "./composables/use-table-range-selection"
import { useRangeCopyFlow } from "./composables/use-range-copy-flow"

// --- CONSTANTS ---
const OVERSCAN_ROWS = 10
const OVERSCAN_COLS = 5
const DEFAULT_COL_WIDTH = 150

interface RowData {
    [key: string]: any
    id: number | string
    height?: number // Thêm thuộc tính height cho dynamic row height
    // Pivot properties (sẽ tồn tại nếu pivotMode=true)
    parentId?: string | null
    level?: number
    isSummary?: boolean
}

// Type definitions
interface Column {
    field: string
    name: string
    width: number
    frozen?: boolean
    position?: "left" | "center" | "right"
    is_dimension?: boolean
    loading?: boolean
    // Range-copy opt-outs / sub-fields (additive — unused unless enableRangeSelect).
    type?: string
    copyable?: boolean
    copyFields?: { key: string; label?: string; field?: string; type?: string; copyable?: boolean }[]
}

interface GroupedRow {
    id: number | string
    level: number
    title: string
    count: number
    data?: RowData
    // Runtime fields used during grouped sort/build; optional since not every row carries them.
    isGroup?: boolean
    groupValue?: any
}

interface VirtualColumn extends Column {
    left: number
}

interface SortConfig {
    field: string | null
    direction: "asc" | "desc" | null
}

interface ColumnResizeEvent {
    field: string
    width: number
    action: "resize" | "reset"
}

interface RowSelectEvent {
    rowId: string | number
    selected: boolean
    allSelected: (string | number)[]
}

interface RowSelectAllEvent {
    selected: (string | number)[]
    allSelected: boolean
}

interface SortChangeEvent {
    field: string | null
    direction: "asc" | "desc" | null
}

interface FilterChangeEvent {
    field: string
    value: string
}

interface ColumnToggleEvent {
    field: string
    visible: boolean
}

// Props
interface Props {
    data: RowData[]
    columns: Column[]
    showToolbar?: boolean
    showGlobalFilter?: boolean
    showFrozenControls?: boolean
    showCheckbox?: boolean
    showSorting?: boolean
    showColumnFilters?: boolean
    showColumnResize?: boolean
    showColorHighlighting?: boolean
    defaultRowGroups?: string[]
    rowHeight?: number
    stripe?: boolean
    checkedConfig?: {
        selected: string[]
        is_select_all: boolean
    }
    paging?: {
        page: number
        limit: number
        total: number
        has_next_page: boolean
    }

    showTotal?: boolean
    enableDynamicRowHeight?: boolean
    loading?: boolean
    table_info?: {
        name: string
        key_id: string
    }
    tools?: string[]
    isBorder?: boolean

    // --- PIVOT PROPS ---
    pivotMode?: boolean // Bật/tắt chế độ pivot
    // pivotDimensions?: string[] // Các cột dùng để phân cấp, ví dụ: ['ten_chien_dich', 'ten_nhom_quang_cao']
    // pivotMetrics?: string[] // Các cột là số liệu, ví dụ: ['so_tien_da_chi_tieu']
    column_pivot?: {
        dimensions: string[]
        metrics: string[]
    }
    // --- END PIVOT PROPS ---

    // --- RANGE SELECT / COPY (Excel-like) ---
    // Off by default → zero behavior change for existing tables.
    enableRangeSelect?: boolean
    // Optional per-cell copy formatter: (columnKey, row) => string | undefined.
    // Returning undefined falls back to String(row[field]).
    formatCopyValue?: (key: string, row: Record<string, any>) => string | undefined
}

const props = withDefaults(defineProps<Props>(), {
    data: () => [],
    columns: () => [],
    showToolbar: true,
    showGlobalFilter: true,
    showFrozenControls: true,
    showCheckbox: false,
    showSorting: true,
    showColumnFilters: true,
    showColumnResize: true,
    showColorHighlighting: true,
    defaultRowGroups: () => [],
    rowHeight: 50,
    stripe: false,
    checkedConfig: () => ({
        selected: [],
        is_select_all: false
    }),
    paging: () => ({
        page: 1,
        limit: 25,
        total: 0,
        has_next_page: false
    }),
    showTotal: false,
    enableDynamicRowHeight: false,
    loading: false,
    table_info: () => ({
        name: "table",
        key_id: "id"
    }),
    tools: () => [],
    isBorder: false,

    // --- PIVOT DEFAULTS ---
    pivotMode: false,
    // pivotDimensions: () => [],
    // pivotMetrics: () => []
    column_pivot: () => ({
        dimensions: [],
        metrics: []
    }),
    // --- END PIVOT DEFAULTS ---

    enableRangeSelect: false
})

// Emits
const emit = defineEmits<{
    (e: "row-select", event: RowSelectEvent): void
    (e: "row-select-all", event: RowSelectAllEvent): void
    (e: "sort-change", event: SortChangeEvent): void
    (e: "filter-change", event: FilterChangeEvent): void
    (e: "column-toggle", event: ColumnToggleEvent): void
    (e: "column-resize", event: ColumnResizeEvent): void
    (e: "pivot-columns-change", event: { dimensions: string[]; metrics: string[] }): void
    (e: "change-paging", event: { page: number; limit: number }): void
    (e: "refresh"): void
}>()

// Reactive data
const globalFilter = ref<string>("")
const groupMode = ref<boolean>(false)
const selectedRows = ref<Set<string | number>>(new Set())
const expandedGroups = ref<Set<string>>(new Set())
const sortConfig = ref<SortConfig>({ field: null, direction: null })
const columnFilters = ref<Record<string, string>>({})
const rowGroups = ref<string[]>([...props.defaultRowGroups])
const visibleColumnFields = ref<Set<string>>(new Set())
// const columnsApply = ref<string[]>(props.columns.map(col => col.field))
// const columnsApply = ref<string[]>(currentColumns.value.map(col => col.field))
const toolbarRight = ref<HTMLElement | null>(null)
const colOpenOption = ref<string | null>(null)

// Fullscreen state
const isFullscreen = ref<boolean>(false)

// Window resize timeout
let windowResizeTimeout: ReturnType<typeof setTimeout> | null = null

// Color highlighting functionality
const colorRule = ref({
    column: "",
    operator: "",
    value: "",
    color: ""
})
const colorRules = ref<any[]>([])

// Grid virtualization
const gridBody = ref<HTMLElement | null>(null)
const gridHeader = ref<HTMLElement | null>(null)
const dataGridMain = ref<HTMLElement | null>(null)
const scrollTop = ref<number>(0)
const containerHeight = ref<number>(400)
const startIndex = ref<number>(0)
const endIndex = ref<number>(0)

// --- VIRTUAL COLUMN STATE ---
const scrollLeft = ref<number>(0)
const viewportWidth = ref<number>(800)

// Column resizing
const resizingColumn = ref<Column | null>(null)
const startX = ref<number>(0)
const startWidth = ref<number>(0)
const defaultColumnWidths = ref<Map<string, number>>(new Map())
const columnWidths = ref<Map<string, number>>(new Map())

// Thêm state cho preview resize
const isResizing = ref<boolean>(false)
const previewPosition = ref<number>(0)
const originalWidth = ref<number>(0)
const columnStartPosition = ref<number>(0)

// Thứ tự thao tác đóng băng cột
const frozenOrder = ref<string[]>([])

// State cho drag and drop row groups
const draggedIndex = ref<number | null>(null)
const draggedField = ref<string | null>(null)

// Computed property để lấy width của column
const getColumnWidth = (field: string): number => {
    return columnWidths.value.get(field) || defaultColumnWidths.value.get(field) || DEFAULT_COL_WIDTH
}

// Computed properties
const currentData = computed<RowData[]>(() => props.data)
const currentColumns = computed<Column[]>(() => {
    const config_column = localStorage.getItem("config_column") || "{}"
    const config = JSON.parse(config_column)
    const col_config = config[`config_${props.table_info.name}`]?.map((col: any) => col.field) || []

    return props.columns
        .filter(col => {
            if (props.pivotMode) {
                return props.column_pivot.dimensions.includes(col.field) || props.column_pivot.metrics.includes(col.field)
            } else return col
        })
        .sort((a, b) => {
            if (props.pivotMode) {
                if (props.column_pivot.dimensions.includes(a.field) && props.column_pivot.dimensions.includes(b.field)) {
                    return props.column_pivot.dimensions.indexOf(a.field) - props.column_pivot.dimensions.indexOf(b.field)
                } else return 0
            } else {
                return col_config.indexOf(a.field) - col_config.indexOf(b.field)
            }
        })
})
// Khởi tạo columnsApply từ localStorage nếu có, nếu không thì lấy tất cả
const getInitialColumnsApply = (): string[] => {
    const config_column = localStorage.getItem("config_column") || "{}"
    const config = JSON.parse(config_column)
    const savedColumns = config[`config_${props.table_info.name}`]

    if (savedColumns && Array.isArray(savedColumns) && savedColumns.length > 0) {
        // Chỉ lấy các cột đã lưu và vẫn tồn tại trong currentColumns
        const savedFields = savedColumns.map((col: any) => col.field)
        const validFields = savedFields.filter((field: string) => currentColumns.value.some(col => col.field === field))
        return validFields.length > 0 ? validFields : currentColumns.value.map(col => col.field)
    }

    return currentColumns.value.map(col => col.field)
}
const columnsApply = ref<string[]>(getInitialColumnsApply())

const availableColumns = computed<Column[]>(() => {
    return currentColumns.value.filter(col => columnsApply.value.includes(col.field))
})

// --- VIRTUAL COLUMN COMPUTED PROPERTIES ---
const frozenColumns = computed(() => {
    // Sắp xếp theo thứ tự trong frozenOrder, đảm bảo các cột đóng băng mới nhất ở cuối
    const frozen = currentColumns.value.filter(col => col.frozen && columnsApply.value.includes(col.field))
    return frozen
        .sort((a, b) => {
            const aIndex = frozenOrder.value.indexOf(a.field)
            const bIndex = frozenOrder.value.indexOf(b.field)
            // Nếu không tìm thấy trong frozenOrder, đặt ở cuối
            if (aIndex === -1) return 1
            if (bIndex === -1) return -1
            return aIndex - bIndex
        })
        .map((col, index) => ({ ...col, index }))
})

const nonFrozenColumns = computed(() => {
    // Sắp xếp theo thứ tự trong columnsApply
    const nonFrozen = currentColumns.value.filter(col => !col.frozen && columnsApply.value.includes(col.field))
    return nonFrozen
        .sort((a, b) => {
            const aIndex = columnsApply.value.indexOf(a.field)
            const bIndex = columnsApply.value.indexOf(b.field)
            return aIndex - bIndex
        })
        .map((col, index) => ({ ...col, index }))
})

const frozenWidth = computed(() => {
    let width = props.showCheckbox ? 60 : 0
    return width + frozenColumns.value.reduce((sum, col) => sum + getColumnWidth(col.field), 0)
})

const nonFrozenWidth = computed(() => {
    return nonFrozenColumns.value.reduce((sum, col) => sum + getColumnWidth(col.field), 0)
})

const nonFrozenColumnOffsets = computed(() => {
    const offsets = new Map<string, number>()
    let left = frozenWidth.value
    for (const col of nonFrozenColumns.value) {
        offsets.set(col.field, left)
        left += getColumnWidth(col.field)
    }
    return offsets
})

const virtualNonFrozenColumns = computed<VirtualColumn[]>(() => {
    const virtualCols: VirtualColumn[] = []
    const overscan = OVERSCAN_COLS * DEFAULT_COL_WIDTH
    const visibleStart = scrollLeft.value - overscan
    const visibleEnd = scrollLeft.value + viewportWidth.value + overscan

    for (const col of nonFrozenColumns.value) {
        const colLeft = nonFrozenColumnOffsets.value.get(col.field) ?? 0
        const colWidth = getColumnWidth(col.field)
        if (colLeft + colWidth > visibleStart && colLeft < visibleEnd) {
            virtualCols.push({ ...col, left: colLeft, width: colWidth })
        }
    }
    return virtualCols
})

// Đảm bảo thứ tự cột frozen luôn đứng trước
const visibleColumns = computed(() => {
    const frozen = frozenColumns.value
    const nonFrozen = nonFrozenColumns.value
    return [...frozen, ...nonFrozen]
})

const hasGrouping = computed<boolean>(() => rowGroups.value.length > 0)

// Computed property để xác định cột đóng băng cuối cùng
const lastFrozenColumn = computed(() => {
    const frozen = frozenColumns.value
    return frozen.length > 0 ? frozen[frozen.length - 1] : null
})

// Computed property để kiểm tra có đang scroll ngang không
const isScrollingHorizontally = computed(() => {
    return scrollLeft.value > 0
})

const filteredData = computed<RowData[]>(() => {
    let data = [...currentData.value]

    // Apply global filter
    if (globalFilter.value) {
        data = data.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(globalFilter.value.toLowerCase())))
    }

    // Apply column filters
    Object.entries(columnFilters.value).forEach(([field, filterValue]) => {
        if (filterValue) {
            data = data.filter(row =>
                String(row[field] || "")
                    .toLowerCase()
                    .includes(filterValue.toLowerCase())
            )
        }
    })

    return data
})

const groupedData = computed<GroupedRow[]>(() => {
    if (!hasGrouping.value) {
        return filteredData.value.map(row => ({
            data: row,
            isGroup: false,
            level: 1
        }))
    }

    const arr = [
        {
            id: "0",
            index: 0,
            count: 4,
            title: "group 1",
            level: 1
        },
        {
            id: "1",
            index: 4,
            count: 1,
            title: "group 2",
            level: 1
        },
        {
            id: "2",
            index: 5,
            count: 1,
            title: "group 3",
            level: 1
        }
    ]
    for (let i = 10; i < 1000; i++) {
        arr.push({
            id: `${i}`,
            index: i,
            count: 1,
            title: `group ${i}`,
            level: 1
        })
    }
    const obj: Record<string, any[]> = {
        "0": [
            {
                id: "0_0",
                index: 1,
                count: 1,
                title: "con của gr 1",
                level: 2
            },
            {
                id: "0_1",
                index: 2,
                count: 1,
                title: "con của gr 1",
                level: 2
            },
            {
                id: "0_2",
                index: 3,
                count: 2,
                title: "con của gr 1",
                level: 2
            }
        ],

        "0_0": [
            {
                id: "0_0_0",
                index: 2,
                level: 3,
                data: { id: 1, full_name: "người 290", email: "thông tin 2@example.com", company: "Company 1", company_model: "Agency và kinh doanh Online", created_at: "20/10/2022", gate_interest: "AI & Machine Learning", ad_budget_month: 1000000000, ad_account_quantity: 2, company_subtype: "Online", preliminary_needs: "AI & Machine Learning", bant_budget: 1000000000, bant_authority: "AI & Machine Learning", bant_need: "AI & Machine Learning", bant_timeline: "AI & Machine Learning", smit_employee_managers: "AI & Machine Learning", source: "AI & Machine Learning", rate_score: 5, mql_date: "20/10/2022", potential_assessment: "AI & Machine Learning", priority_level: "AI & Machine Learning", count_duplicated: 100, count_utm: 100, status: "MQL" }
            }
        ],
        "0_1": [
            {
                id: "0_1_0",
                index: 3,
                level: 3,
                data: { id: 2, full_name: "người 291", email: "thông tin 3@example.com", company: "Company 2", company_model: "Agency", created_at: "21/10/2022", gate_interest: "Cloud Computing", ad_budget_month: 500000000, ad_account_quantity: 1, company_subtype: "Agency", preliminary_needs: "Cloud Infrastructure", bant_budget: 500000000, bant_authority: "Cloud Computing", bant_need: "Cloud Computing", bant_timeline: "Q2 2023", smit_employee_managers: "John Doe", source: "Website", rate_score: 4, mql_date: "21/10/2022", potential_assessment: "High", priority_level: "Medium", count_duplicated: 50, count_utm: 75, status: "SQL" }
            }
        ],
        "0_2": [
            {
                id: "0_2_0",
                index: 3,
                level: 3,
                data: { id: 2, full_name: "người 29", email: "thông tin 3@example.com", company: "Company 2", company_model: "Agency", created_at: "21/10/2022", gate_interest: "Cloud Computing", ad_budget_month: 500000000, ad_account_quantity: 1, company_subtype: "Agency", preliminary_needs: "Cloud Infrastructure", bant_budget: 500000000, bant_authority: "Cloud Computing", bant_need: "Cloud Computing", bant_timeline: "Q2 2023", smit_employee_managers: "John Doe", source: "Website", rate_score: 4, mql_date: "21/10/2022", potential_assessment: "High", priority_level: "Medium", count_duplicated: 50, count_utm: 75, status: "SQL" }
            }
            // {
            //     id: "0_2_1",
            //     index: 4,
            //     level: 3,
            //     data: { id: 2, full_name: "người 299", email: "thông tin 3@example.com", company: "Company 2", company_model: "Agency", created_at: "21/10/2022", gate_interest: "Cloud Computing", ad_budget_month: 500000000, ad_account_quantity: 1, company_subtype: "Agency", preliminary_needs: "Cloud Infrastructure", bant_budget: 500000000, bant_authority: "Cloud Computing", bant_need: "Cloud Computing", bant_timeline: "Q2 2023", smit_employee_managers: "John Doe", source: "Website", rate_score: 4, mql_date: "21/10/2022", potential_assessment: "High", priority_level: "Medium", count_duplicated: 50, count_utm: 75, status: "SQL" }
            // }
        ],

        "1": [
            {
                id: "1_0",
                index: 5,
                level: 2,
                data: { id: 3, full_name: "người 292", email: "thông tin 4@example.com", company: "Company 3", company_model: "Online", created_at: "22/10/2022", gate_interest: "E-commerce", ad_budget_month: 200000000, ad_account_quantity: 3, company_subtype: "E-commerce", preliminary_needs: "Marketing Tools", bant_budget: 200000000, bant_authority: "Marketing Manager", bant_need: "Digital Marketing", bant_timeline: "Q1 2023", smit_employee_managers: "Jane Smith", source: "Referral", rate_score: 3, mql_date: "22/10/2022", potential_assessment: "Medium", priority_level: "Low", count_duplicated: 25, count_utm: 40, status: "Lead" }
            }
        ]
    }

    // Hàm đệ quy để duyệt và xây dựng mảng cuối cùng
    const buildFinalArray = (parentId: string | null = null, parentGroups: string[] = []): any[] => {
        const result: any[] = []

        if (parentId === null) {
            // Xử lý các group level 1
            arr.forEach(group => {
                result.push({ ...group, parentGroups: [] })

                if (expandedGroups.value.has(group.id)) {
                    const children = buildFinalArray(group.id, [group.id])
                    result.push(...children)
                }
            })
        } else if (obj[parentId]) {
            // Xử lý các phần tử con
            obj[parentId].forEach((item, index) => {
                const itemWithParents = { ...item, parentGroups }
                result.push(itemWithParents)

                // Nếu là group và được expand, đệ quy tiếp
                if (!item.data && expandedGroups.value.has(item.id)) {
                    const children = buildFinalArray(item.id, [...parentGroups, item.id])
                    result.push(...children)
                }
            })
        }

        return result.map((item, index) => ({ ...item, index }))
    }

    const finalArray = buildFinalArray()

    // Tính toán endGroups và isFinal cho mỗi row
    for (let i = 0; i < finalArray.length; i++) {
        const currentRow = finalArray[i]
        const nextRow = finalArray[i + 1]

        currentRow.endGroups = []
        currentRow.isFinalGroup = false

        // Nếu là row cuối cùng trong toàn bộ data
        if (i === finalArray.length - 1) {
            // Row cuối cùng kết thúc tất cả các group cha của nó
            const endingLevels: number[] = []
            for (let level = 0; level < currentRow.parentGroups.length; level++) {
                endingLevels.push(level + 1)
            }
            currentRow.endGroups = endingLevels
            currentRow.isFinalGroup = true
        } else if (nextRow) {
            // So sánh parentGroups của row hiện tại và row tiếp theo
            const currentParents = currentRow.parentGroups || []
            const nextParents = nextRow.parentGroups || []

            // Tìm các level của group kết thúc (để vẽ border đóng group)
            const endingLevels: number[] = []

            // Nếu row tiếp theo có ít parent hơn, nghĩa là một số group đã kết thúc
            if (nextParents.length < currentParents.length) {
                // Các level từ nextParents.length trở lên là kết thúc
                for (let level = nextParents.length; level < currentParents.length; level++) {
                    endingLevels.push(level + 1)
                }
            } else if (nextParents.length === currentParents.length && nextParents.length > 0) {
                // Kiểm tra xem có group nào thay đổi không
                for (let j = 0; j < currentParents.length; j++) {
                    if (currentParents[j] !== nextParents[j]) {
                        // Từ level này trở đi đều kết thúc
                        for (let level = j; level < currentParents.length; level++) {
                            endingLevels.push(level + 1)
                        }
                        break
                    }
                }
            }

            currentRow.endGroups = endingLevels
            currentRow.isFinalGroup = endingLevels.length > 0
        }
    }

    // Debug log
    console.log(
        "Final array with endGroups:",
        finalArray.map(row => ({
            id: row.id,
            level: row.level,
            hasData: !!row.data,
            parentGroups: row.parentGroups,
            endGroups: row.endGroups,
            isFinalGroup: row.isFinalGroup
        }))
    )

    return finalArray

    // logic cũ
    // // Hàm đệ quy để tạo group theo nhiều cột
    // const createGroupsRecursive = (rows: RowData[], groupFields: string[], level: number = 1, parentGroupKey: string = ""): GroupedRow[] => {
    //     if (groupFields.length === 0 || rows.length === 0) {
    //         // Nếu không còn cột để group, trả về các row data và đánh dấu row cuối
    //         return rows.map((row, index) => ({
    //             data: row,
    //             isGroup: false,
    //             level,
    //             parentGroupKey,
    //             isFinalGroup: index === rows.length - 1
    //         }));
    //     }

    //     const currentField = groupFields[0];
    //     const remainingFields = groupFields.slice(1);
    //     const groups: Record<string, RowData[]> = {};

    //     // Group theo cột hiện tại
    //     rows.forEach(row => {
    //         const groupValue = String(row[currentField] || "");
    //         if (!groups[groupValue]) {
    //             groups[groupValue] = [];
    //         }
    //         groups[groupValue].push(row);
    //     });

    //     const result: GroupedRow[] = [];

    //     // Xử lý từng group
    //     Object.entries(groups).forEach(([groupValue, groupRows]) => {
    //         const groupKey = parentGroupKey ? `${parentGroupKey}|${currentField}:${groupValue}` : `${currentField}:${groupValue}`;

    //         // Thêm header của group
    //         result.push({
    //             isGroup: true,
    //             groupKey,
    //             groupValue,
    //             groupField: currentField,
    //             count: groupRows.length,
    //             level,
    //             parentGroupKey
    //         });

    //         // Kiểm tra xem group này có được expand không
    //         if (expandedGroups.value.has(groupKey)) {
    //             // Nếu còn cột để group, tiếp tục đệ quy
    //             if (remainingFields.length > 0) {
    //                 const subGroups = createGroupsRecursive(groupRows, remainingFields, level + 1, groupKey);
    //                 // Đánh dấu row cuối cùng trong subGroups
    //                 if (subGroups.length > 0) {
    //                     subGroups[subGroups.length - 1].isFinalGroup = true;
    //                 }
    //                 result.push(...subGroups);
    //             } else {
    //                 // Nếu không còn cột để group, thêm các row data
    //                 groupRows.forEach((row, index) => {
    //                     result.push({
    //                         data: row,
    //                         isGroup: false,
    //                         level: level + 1,
    //                         parentGroupKey: groupKey,
    //                         isFinalGroup: index === groupRows.length - 1
    //                     });
    //                 });
    //             }
    //         }
    //     });

    //     return result;
    // };

    // const groupedResult = createGroupsRecursive(filteredData.value, rowGroups.value);

    // // Post-processing: Đánh dấu lại isFinalGroup cho các row cuối cùng trước mỗi group mới
    // for (let i = 0; i < groupedResult.length - 1; i++) {
    //     const currentRow = groupedResult[i];
    //     const nextRow = groupedResult[i + 1];

    //     // Kiểm tra nếu row hiện tại là row cuối cùng trong group của nó
    //     // Điều này xảy ra khi row tiếp theo có level <= level của row hiện tại
    //     if (nextRow.level <= currentRow.level) {
    //         currentRow.isFinalGroup = true;
    //     }
    // }

    // // Row cuối cùng trong toàn bộ data luôn là final
    // if (groupedResult.length > 0) {
    //     groupedResult[groupedResult.length - 1].isFinalGroup = true;
    // }

    // // Tính heightGroup cho mỗi group
    // const calculateGroupHeight = (startIndex: number): { height: number; nextIndex: number } => {
    //     const groupRow = groupedResult[startIndex];
    //     if (!groupRow.isGroup) {
    //         return { height: props.rowHeight, nextIndex: startIndex + 1 };
    //     }

    //     let totalHeight = 0;
    //     let currentIndex = startIndex + 1;
    //     let spacingCount = 0;
    //     let previousRow: GroupedRow | null = null;

    //     // Duyệt qua tất cả các phần tử con của group này
    //     while (currentIndex < groupedResult.length) {
    //         const currentRow = groupedResult[currentIndex];

    //         // Nếu gặp group cùng cấp hoặc cấp thấp hơn thì dừng
    //         if (currentRow.isGroup && currentRow.level <= groupRow.level) {
    //             break;
    //         }

    //         // Nếu là phần tử con của group này
    //         if (currentRow.level > groupRow.level) {
    //             // Tính khoảng cách giữa các group con
    //             if (currentRow.isGroup && previousRow) {
    //                 if (!previousRow.isGroup || previousRow.level >= currentRow.level) {
    //                     spacingCount++;
    //                 }
    //             }

    //             if (currentRow.isGroup) {
    //                 // Nếu là group con, cộng height của chính group con
    //                 totalHeight += props.rowHeight;

    //                 // Nếu group con được expand, tính thêm height của các phần tử bên trong
    //                 if (expandedGroups.value.has(currentRow.groupKey!)) {
    //                     const subGroupResult = calculateGroupHeight(currentIndex);
    //                     totalHeight += subGroupResult.height;
    //                     currentIndex = subGroupResult.nextIndex;
    //                 } else {
    //                     currentIndex++;
    //                 }
    //             } else {
    //                 // Nếu là data row
    //                 totalHeight += props.rowHeight;
    //                 currentIndex++;
    //             }

    //             previousRow = currentRow;
    //         } else {
    //             break;
    //         }
    //     }

    //     // Cộng thêm khoảng cách giữa các group con
    //     totalHeight += spacingCount * GROUP_SPACING;

    //     // Gán heightGroup cho group row
    //     groupRow.heightGroup = totalHeight;

    //     return { height: totalHeight, nextIndex: currentIndex };
    // };

    // // Tính heightGroup cho tất cả các group
    // let index = 0;
    // while (index < groupedResult.length) {
    //     if (groupedResult[index].isGroup) {
    //         const result = calculateGroupHeight(index);
    //         index = result.nextIndex;
    //     } else {
    //         index++;
    //     }
    // }

    // // Tính heightTransform cho mỗi group (tổng chiều cao bao gồm spacing và padding)
    // const calculateHeightTransform = (startIndex: number): { height: number; nextIndex: number } => {
    //     const groupRow = groupedResult[startIndex];
    //     if (!groupRow.isGroup) {
    //         return { height: props.rowHeight, nextIndex: startIndex + 1 };
    //     }

    //     let totalHeight = 20;
    //     let currentIndex = startIndex + 1;
    //     let spacingCount = 0;
    //     let previousRow: GroupedRow | null = null;
    //     let hasDataRows = false;

    //     // Duyệt qua tất cả các phần tử con của group này
    //     while (currentIndex < groupedResult.length) {
    //         const currentRow = groupedResult[currentIndex];

    //         // Nếu gặp group cùng cấp hoặc cấp thấp hơn thì dừng
    //         if (currentRow.isGroup && currentRow.level <= groupRow.level) {
    //             break;
    //         }

    //         // Nếu là phần tử con của group này
    //         if (currentRow.level > groupRow.level) {
    //             // Tính khoảng cách giữa các group con
    //             if (currentRow.isGroup && previousRow) {
    //                 if (!previousRow.isGroup || previousRow.level >= currentRow.level) {
    //                     spacingCount++;
    //                 }
    //             }

    //             if (currentRow.isGroup) {
    //                 // Nếu là group con, tính đệ quy
    //                 const subGroupResult = calculateHeightTransform(currentIndex);
    //                 totalHeight += subGroupResult.height;
    //                 currentIndex = subGroupResult.nextIndex;
    //             } else {
    //                 // Nếu là data row
    //                 totalHeight += props.rowHeight;
    //                 hasDataRows = true;
    //                 currentIndex++;
    //             }

    //             previousRow = currentRow;
    //         } else {
    //             break;
    //         }
    //     }

    //     // Cộng thêm khoảng cách giữa các group con
    //     totalHeight += spacingCount * GROUP_SPACING;

    //     // Nếu có data rows, cộng thêm padding 20px
    //     if (hasDataRows) {
    //         totalHeight += 20;
    //     }

    //     // Gán heightTransform cho group row
    //     groupRow.heightTransform = totalHeight;

    //     return { height: totalHeight, nextIndex: currentIndex };
    // };

    // // Tính heightTransform cho tất cả các group
    // let transformIndex = 0;
    // while (transformIndex < groupedResult.length) {
    //     if (groupedResult[transformIndex].isGroup) {
    //         const result = calculateHeightTransform(transformIndex);
    //         transformIndex = result.nextIndex;
    //     } else {
    //         transformIndex++;
    //     }
    // }

    // // Tính endGroups cho mỗi row (bao gồm cả group rows và data rows)
    // for (let i = 0; i < groupedResult.length; i++) {
    //     const currentRow = groupedResult[i];
    //     const endGroupLevels: number[] = [];

    //     // Kiểm tra row tiếp theo
    //     if (i < groupedResult.length - 1) {
    //         const nextRow = groupedResult[i + 1];

    //         // Xác định level cần so sánh
    //         // Với group row: dùng chính level của nó
    //         // Với data row: dùng level của nó (level của data row = level group cha + 1)
    //         const currentLevel = currentRow.level;

    //         // Nếu row tiếp theo có level <= currentLevel
    //         if (nextRow.level <= currentLevel) {
    //             // Row hiện tại kết thúc các group từ nextRow.level đến:
    //             // - Với group row: currentLevel (chính nó)
    //             // - Với data row: currentLevel - 1 (group cha của nó)
    //             const maxLevel = currentRow.isGroup ? currentLevel : currentLevel - 1;

    //             for (let level = nextRow.level; level <= maxLevel; level++) {
    //                 endGroupLevels.push(level);
    //             }
    //         }
    //     } else {
    //         // Nếu là row cuối cùng trong toàn bộ data
    //         // Kết thúc tất cả các group từ level 1 đến:
    //         // - Với group row: currentLevel (chính nó)
    //         // - Với data row: currentLevel - 1 (group cha của nó)
    //         const maxLevel = currentRow.isGroup ? currentRow.level : currentRow.level - 1;

    //         for (let level = 1; level <= maxLevel; level++) {
    //             endGroupLevels.push(level);
    //         }
    //     }

    //     // Chỉ gán nếu có ít nhất một level
    //     if (endGroupLevels.length > 0) {
    //         currentRow.endGroups = endGroupLevels;
    //     }
    // }

    // console.log(groupedResult);

    // return groupedResult;
})

const sortedData = computed<GroupedRow[]>(() => {
    let data = [...groupedData.value]

    if (sortConfig.value.field && sortConfig.value.direction && hasGrouping.value) {
        // Nếu có grouping, cần sort theo cách khác để giữ cấu trúc group

        // Hàm đệ quy để sort trong từng group với nhiều cấp
        const sortGroupedData = (items: GroupedRow[], level: number = 0): GroupedRow[] => {
            const result: GroupedRow[] = []
            let i = 0

            while (i < items.length) {
                const current = items[i]
                if (!current) {
                    i++
                    continue
                }

                if (current.isGroup) {
                    // Thêm group header
                    result.push(current)
                    i++

                    // Thu thập tất cả items thuộc group này (cùng level hoặc level cao hơn)
                    const groupItems: GroupedRow[] = []
                    const currentLevel = current.level

                    while (i < items.length) {
                        const nextItem = items[i]
                        if (!nextItem) {
                            i++
                            continue
                        }

                        // Nếu gặp group khác cùng level hoặc thấp hơn thì dừng
                        if (nextItem.isGroup && nextItem.level <= currentLevel) {
                            break
                        }

                        groupItems.push(nextItem)
                        i++
                    }

                    // Xử lý các items trong group
                    if (groupItems.length > 0) {
                        // Tách thành các sub-groups và data rows
                        const subGroups: GroupedRow[] = []
                        const dataRows: GroupedRow[] = []

                        groupItems.forEach(item => {
                            if (item.isGroup) {
                                subGroups.push(item)
                            } else {
                                dataRows.push(item)
                            }
                        })

                        // Nếu có sub-groups, xử lý đệ quy
                        if (subGroups.length > 0) {
                            const sortedSubItems = sortGroupedData(groupItems, currentLevel + 1)
                            result.push(...sortedSubItems)
                        } else {
                            // Chỉ có data rows, sort chúng
                            dataRows.sort((a, b) => {
                                const aVal = a.data?.[sortConfig.value.field!]
                                const bVal = b.data?.[sortConfig.value.field!]

                                let aCompare = aVal
                                let bCompare = bVal

                                if (typeof aCompare === "string") aCompare = aCompare.toLowerCase()
                                if (typeof bCompare === "string") bCompare = bCompare.toLowerCase()

                                if (aCompare < bCompare) return sortConfig.value.direction === "asc" ? -1 : 1
                                if (aCompare > bCompare) return sortConfig.value.direction === "asc" ? 1 : -1
                                return 0
                            })

                            result.push(...dataRows)
                        }
                    }
                } else {
                    // Không nên xảy ra nếu data được group đúng
                    result.push(current)
                    i++
                }
            }

            return result
        }

        return sortGroupedData(data)
    } else if (sortConfig.value.field && sortConfig.value.direction) {
        // Sort bình thường khi không có grouping
        data.sort((a, b) => {
            let aVal: any = a.isGroup ? a.groupValue : a.data?.[sortConfig.value.field!]
            let bVal: any = b.isGroup ? b.groupValue : b.data?.[sortConfig.value.field!]

            if (typeof aVal === "string") aVal = aVal.toLowerCase()
            if (typeof bVal === "string") bVal = bVal.toLowerCase()

            if (aVal < bVal) return sortConfig.value.direction === "asc" ? -1 : 1
            if (aVal > bVal) return sortConfig.value.direction === "asc" ? 1 : -1
            return 0
        })
    }

    return data
})

// Virtual scrolling
const virtualHeight = computed<number>(() => {
    // Tính tổng khoảng cách cần thêm giữa các group
    let totalSpacing = 0
    let previousRow: any = null

    sortedData.value.forEach((row, index) => {
        const isGroupRow = !row.data
        if (isGroupRow && index > 0 && previousRow) {
            // Thêm khoảng cách cho tất cả các group
            const previousIsGroup = !previousRow.data
            if (!previousIsGroup || previousRow.level >= row.level) {
                // Tính spacing dựa trên số group đang kết thúc
                let spacing = GROUP_SPACING

                // Nếu row trước đó có endGroups (kết thúc nhiều group)
                if (previousRow.endGroups && previousRow.endGroups.length > 0) {
                    spacing = GROUP_SPACING + previousRow.endGroups.length * GROUP_END_SPACING
                }

                totalSpacing += spacing
            }
        }
        previousRow = row
    })

    // Tổng chiều cao = số dòng * chiều cao mỗi dòng + tổng khoảng cách giữa các group
    const totalHeight = sortedData.value.length * props.rowHeight + totalSpacing
    // Nếu muốn min-height, chỉ để nhỏ (ví dụ 200px)
    return Math.max(totalHeight, 200)
})

// Dynamic row height support
const getRowHeight = (row: any, index: number): number => {
    if (!props.enableDynamicRowHeight) {
        return props.rowHeight
    }

    // Xử lý cho pivot mode - row trực tiếp có thuộc tính height
    if (props.pivotMode) {
        if (row && typeof row.height === "number" && row.height > 0) {
            return row.height
        }
        return props.rowHeight
    }

    // Xử lý cho normal mode
    // Nếu là data row (có row.data)
    if (row && row.data) {
        if (typeof row.data.height === "number" && row.data.height > 0) {
            return row.data.height
        }
    }

    return props.rowHeight
}

const lengthLevel = (level: number) => {
    let arr: number[] = []
    // for (let i = 0; i < level - 1; i++) {
    for (let i = 0; i < level; i++) {
        arr.push(i)
    }
    return arr.length
}

// Hằng số khoảng cách giữa các group
const GROUP_SPACING = 20 // Khoảng cách mặc định giữa các group
const GROUP_END_SPACING = 20 // Khoảng cách thêm cho mỗi group kết thúc

// Tính toán vị trí cumulative cho từng row với khoảng cách giữa group
const rowPositionsWithSpacing = computed<number[]>(() => {
    const positions: number[] = []
    const sourceData = finalDataForRendering.value
    let currentPosition = hasGrouping.value ? 20 : 0
    let previousRow: any = null
    let openGroupsStack: any[] = [] // Stack để theo dõi các group đang mở

    for (let i = 0; i < sourceData.length; i++) {
        const row = sourceData[i] as any
        if (!row) continue
        const isGroupRow = !row.data // Group row không có data

        // Xử lý khi gặp group row
        if (isGroupRow) {
            // Nếu không phải row đầu tiên
            if (i > 0 && previousRow) {
                // Kiểm tra xem có cần thêm spacing không
                // Thêm spacing khi:
                // 1. Row trước đó là data row (có row.data)
                // 2. Row trước đó là group cùng cấp hoặc cấp cao hơn (kết thúc một nhóm)
                const previousIsGroup = !previousRow.data
                if (!previousIsGroup || previousRow.level >= row.level) {
                    // Tính spacing dựa trên số group đang kết thúc
                    let spacing = GROUP_SPACING // Khoảng cách mặc định

                    // Nếu row trước đó có endGroups (kết thúc nhiều group)
                    if (previousRow.endGroups && previousRow.endGroups.length > 0) {
                        // Thêm 20px cho mỗi group kết thúc
                        spacing = GROUP_SPACING + previousRow.endGroups.length * GROUP_END_SPACING
                    }

                    currentPosition += spacing
                }
            }

            // Cập nhật stack các group đang mở
            // Pop các group có level >= row.level (đóng các group cũ)
            while (openGroupsStack.length > 0 && openGroupsStack[openGroupsStack.length - 1].level >= row.level) {
                openGroupsStack.pop()
            }
            // Push group hiện tại vào stack
            openGroupsStack.push(row)
        } else {
            // Nếu là data row và trước đó là group row thì không thêm spacing
            // vì data row thuộc về group đó
        }

        positions.push(currentPosition)

        // Thêm chiều cao của row hiện tại
        const rowHeight = props.enableDynamicRowHeight ? getRowHeight(row, i) : props.rowHeight
        currentPosition += rowHeight

        previousRow = row
    }

    return positions
})

// Tính toán vị trí cumulative cho từng row (cho dynamic height)
const rowPositions = computed<number[]>(() => {
    if (!props.enableDynamicRowHeight) {
        return []
    }

    const positions: number[] = [0]
    const sourceData = finalDataForRendering.value

    for (let i = 0; i < sourceData.length; i++) {
        const rowHeight = getRowHeight(sourceData[i], i)
        positions.push((positions[i] ?? 0) + rowHeight)
    }

    return positions
})

const getRowKey = (row: any, index: number): string => {
    return `row-${row.data?.[props.table_info.key_id]}-${index}`
    // if (props.pivotMode) {
    //     return `pivot-${row.id || index}`;
    // }

    // if (!row.data) {
    //     return `group-${row.id || row.groupKey || index}`;
    // }

    // return `row-${row.data?.[props.table_info.key_id] || index}`;
}

// Tính tổng chiều cao cho dynamic height
const totalHeightDynamic = computed<number>(() => {
    if (!props.enableDynamicRowHeight) {
        return virtualHeight.value
    }

    const sourceData = finalDataForRendering.value
    if (sourceData.length === 0) return 200

    return rowPositions.value[rowPositions.value.length - 1] || 200
})

// Tìm row index dựa trên scroll position (cho dynamic height)
const findRowIndexByScrollTop = (scrollTop: number): number => {
    if (!props.enableDynamicRowHeight) {
        return Math.floor(scrollTop / props.rowHeight)
    }

    const positions = rowPositions.value
    if (positions.length === 0) return 0

    // Binary search để tìm index
    let left = 0
    let right = positions.length - 1

    while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const midPos = positions[mid] ?? 0
        if (midPos <= scrollTop && (mid === positions.length - 1 || (positions[mid + 1] ?? 0) > scrollTop)) {
            return mid
        } else if (midPos < scrollTop) {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }

    return Math.max(0, right)
}

// Cập nhật virtualHeight để sử dụng dynamic height và spacing
const virtualHeightFinal = computed<number>(() => {
    if (props.enableDynamicRowHeight) {
        return totalHeightDynamic.value
    }

    // Sử dụng rowPositionsWithSpacing để lấy chiều cao cuối cùng
    const positions = rowPositionsWithSpacing.value
    const sourceData = finalDataForRendering.value

    if (positions.length > 0 && sourceData.length > 0) {
        // Lấy vị trí của row cuối cùng + chiều cao của nó
        const lastPosition = positions[positions.length - 1] ?? 0
        const lastRowHeight = props.rowHeight
        return Math.max(lastPosition + lastRowHeight, 200)
    }

    return Math.max(200, virtualHeight.value)
})

// Sửa visibleRows để sử dụng finalDataForRendering
// const visibleRows = computed<any[]>(() => {
//     const sourceData = finalDataForRendering.value

//     if (!props.enableDynamicRowHeight) {
//         // Logic cũ cho fixed height
//         const start = Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - OVERSCAN_ROWS)
//         const visibleCount = Math.ceil(containerHeight.value / props.rowHeight) + OVERSCAN_ROWS * 2
//         const end = Math.min(start + visibleCount, sourceData.length)

//         startIndex.value = start
//         endIndex.value = end

//         return sourceData.slice(start, end)
//     } else {
//         // Logic mới cho dynamic height
//         const scrollTopValue = scrollTop.value
//         const containerHeightValue = containerHeight.value

//         // Tìm first visible row
//         const startIdx = findRowIndexByScrollTop(scrollTopValue)
//         const start = Math.max(0, startIdx - OVERSCAN_ROWS)

//         // Tìm last visible row
//         let end = start
//         let currentHeight = 0
//         const positions = rowPositions.value

//         for (let i = start; i < sourceData.length; i++) {
//             const rowHeight = getRowHeight(sourceData[i], i)
//             const rowTop = positions[i] || 0
//             const rowBottom = rowTop + rowHeight

//             // Nếu row này vẫn trong viewport hoặc chưa đủ buffer
//             if (rowTop <= scrollTopValue + containerHeightValue + OVERSCAN_ROWS * props.rowHeight) {
//                 end = i + 1
//             } else {
//                 break
//             }
//         }

//         end = Math.min(end + OVERSCAN_ROWS, sourceData.length)

//         startIndex.value = start
//         endIndex.value = end

//         return sourceData.slice(start, end)
//     }
// })
const visibleRows = computed<any[]>(() => {
    const sourceData = finalDataForRendering.value
    const positions = rowPositionsWithSpacing.value

    if (!props.enableDynamicRowHeight && positions.length > 0) {
        // Tìm index bắt đầu dựa trên scroll position với spacing
        const scrollTopValue = scrollTop.value
        const containerHeightValue = containerHeight.value

        // Binary search để tìm start index với positions đã tính spacing
        let startIdx = 0
        for (let i = 0; i < positions.length; i++) {
            if ((positions[i] ?? 0) > scrollTopValue) {
                startIdx = Math.max(0, i - 1)
                break
            }
        }

        // Tìm end index
        let endIdx = startIdx
        for (let i = startIdx; i < positions.length; i++) {
            if ((positions[i] ?? 0) > scrollTopValue + containerHeightValue) {
                endIdx = i
                break
            }
            endIdx = i + 1
        }

        const start = Math.max(0, startIdx - OVERSCAN_ROWS)
        const end = Math.min(endIdx + OVERSCAN_ROWS, sourceData.length)

        startIndex.value = start
        endIndex.value = end

        return sourceData.slice(start, end)
    } else if (props.enableDynamicRowHeight) {
        // Logic cho dynamic height (giữ nguyên)
        const scrollTopValue = scrollTop.value
        const containerHeightValue = containerHeight.value

        const startIdx = findRowIndexByScrollTop(scrollTopValue)
        const start = Math.max(0, startIdx - OVERSCAN_ROWS)

        let end = start
        const positions = rowPositions.value

        for (let i = start; i < sourceData.length; i++) {
            const rowHeight = getRowHeight(sourceData[i], i)
            const rowTop = positions[i] || 0

            if (rowTop <= scrollTopValue + containerHeightValue + OVERSCAN_ROWS * props.rowHeight) {
                end = i + 1
            } else {
                break
            }
        }

        end = Math.min(end + OVERSCAN_ROWS, sourceData.length)

        startIndex.value = start
        endIndex.value = end

        return sourceData.slice(start, end)
    }

    return []
})

const totalRows = computed<number>(() => currentData.value.length)

const isAllSelected = computed<boolean>(() => {
    // const selectableRows = currentData.value.filter(row => !("isGroup" in row))
    // return selectableRows.length > 0 && selectableRows.every(row => selectedRows.value.has(row.id))
    const selectableRows = currentData.value.filter(row => !("isGroup" in row)).map(row => String(row[props.table_info.key_id]))
    return props.checkedConfig.selected.length > 0 && selectableRows.every(id => props.checkedConfig.selected.includes(id))
})

const totalTableWidth = computed<number>(() => {
    let columns = currentColumns.value.filter(col => columnsApply.value.includes(col.field))
    let width = props.showCheckbox ? 60 : 0
    return width + columns.reduce((sum, col) => sum + getColumnWidth(col.field), 0)
})

const hasFrozenColumns = computed<boolean>(() => {
    return visibleColumns.value.some(col => col.frozen)
})

// Color highlighting computed properties
const isColorRuleValid = computed<boolean>(() => {
    return !!(colorRule.value.column && colorRule.value.operator && colorRule.value.value && colorRule.value.color)
})

// methods -------------------------------------------------------------------------------------------------------------
// --- PIVOT STATE ---
const expandedPivotRows = ref<Set<string | number>>(new Set())

// Khởi tạo trạng thái mở rộng mặc định cho pivot
const initializePivotState = () => {
    if (props.pivotMode) {
        props.data.forEach(row => {
            if (row.isSummary) {
                expandedPivotRows.value.add(row.id)
            }
        })
    }
}

watch(() => props.data, initializePivotState, { immediate: true })

// Watch để tự động cập nhật đóng băng khi pivotMode hoặc pivotDimensions thay đổi
watch(() => props.pivotMode, updatePivotColumnFreezingAfter)
watch(() => props.column_pivot.dimensions, updatePivotColumnFreezingAfter, {
    deep: true
})

// Watch để tự động cập nhật đóng băng khi viewportWidth thay đổi trong pivotMode
watch(
    () => viewportWidth.value,
    () => {
        if (props.pivotMode) {
            updatePivotColumnFreezingAfter()
        }
    }
)

// Hàm helper để tự động đóng băng cột dimensions trong pivot mode (được định nghĩa sau updateFrozenPositions)
function updatePivotColumnFreezingAfter() {
    if (props.pivotMode && props.column_pivot.dimensions.length > 0) {
        // Tính tổng width của các cột dimensions
        const dimensionsWidth = props.column_pivot.dimensions.reduce((total, dimensionField) => {
            const column = currentColumns.value.find(col => col.field === dimensionField)
            return total + (column ? getColumnWidth(column.field) : DEFAULT_COL_WIDTH)
        }, 0)

        // Tính width của container (bao gồm checkbox và group column nếu có)
        const containerWidth = viewportWidth.value || 800
        const checkboxWidth = props.showCheckbox ? 60 : 0
        const groupWidth = hasGrouping.value ? 200 : 0
        const availableWidth = containerWidth - checkboxWidth - groupWidth

        // Kiểm tra nếu tổng width dimensions vượt quá 70% container width
        const maxAllowedWidth = availableWidth * 0.7

        if (dimensionsWidth > maxAllowedWidth) {
            // Nếu vượt quá 70%, bỏ đóng băng tất cả dimensions
            props.column_pivot.dimensions.forEach(dimensionField => {
                const column = currentColumns.value.find(col => col.field === dimensionField)
                if (column && column.frozen) {
                    column.frozen = false
                    frozenOrder.value = frozenOrder.value.filter(f => f !== dimensionField)
                }
            })
        } else {
            // Nếu không vượt quá 70%, đóng băng các cột dimensions
            props.column_pivot.dimensions.forEach(dimensionField => {
                const column = currentColumns.value.find(col => col.field === dimensionField)
                if (column && !column.frozen) {
                    column.frozen = true
                    if (!frozenOrder.value.includes(dimensionField)) {
                        frozenOrder.value.push(dimensionField)
                    }
                }
            })
        }

        // Sử dụng nextTick để đảm bảo updateFrozenPositions đã được định nghĩa
        nextTick(() => {
            if (typeof updateFrozenPositions === "function") {
                updateFrozenPositions()
            }
        })
    } else if (!props.pivotMode) {
        // Nếu không ở pivot mode, có thể bỏ đóng băng các cột dimensions (tùy chọn)
        // props.pivotDimensions.forEach(dimensionField => {
        //     const column = currentColumns.value.find(col => col.field === dimensionField)
        //     if (column && column.frozen) {
        //         column.frozen = false
        //         frozenOrder.value = frozenOrder.value.filter(f => f !== dimensionField)
        //     }
        // })
        // updateFrozenPositions()
    }
}

// --- COMPUTED FOR PIVOT ---
const pivotProcessedData = computed(() => {
    if (!props.pivotMode) {
        return [] // Không áp dụng nếu không ở pivot mode
    }

    // Lọc ra các hàng con của các nhóm bị đóng
    return props.data.filter(row => {
        if (row.level === 0) {
            return true // Luôn hiển thị cấp cao nhất
        }
        // Chỉ hiển thị nếu parent của nó được mở rộng
        return row.parentId ? expandedPivotRows.value.has(row.parentId) : true
    })
})

// Dữ liệu cuối cùng để render, tùy thuộc vào pivotMode
const finalDataForRendering = computed(() => {
    const data = props.pivotMode ? pivotProcessedData.value : sortedData.value

    // Nếu không có data, tạo 10 row trống
    if (data.length === 0) {
        const emptyRows = []
        for (let i = 0; i < 10; i++) {
            // if (props.pivotMode) {
            //     // Tạo row trống cho pivot mode
            //     emptyRows.push({
            //         id: `empty-${i}`,
            //         level: 0,
            //         isSummary: false,
            //         // Tạo dữ liệu trống cho từng cột
            //         ...Object.fromEntries([...props.column_pivot.dimensions, ...props.column_pivot.metrics].map(field => [field, ""]))
            //     })
            // } else {
            //     // Tạo row trống cho normal mode
            //     emptyRows.push({
            //         isGroup: false,
            //         level: 0,
            //         data: {
            //             id: `empty-${i}`,
            //             // Tạo dữ liệu trống cho từng cột
            //             ...Object.fromEntries(currentColumns.value.map(col => [col.field, ""]))
            //         }
            //     })
            // }
            emptyRows.push({})
        }
        return emptyRows
    }

    return data
})

// ─────────────────────────────────────────────────────────────
// Range selection + Excel-like copy (opt-in via enableRangeSelect)
// ─────────────────────────────────────────────────────────────

// Active only on plain tables — group/pivot use indented/summary rows whose
// coordinate model the index-based mapping does not cover.
const rangeSelectActive = computed<boolean>(() => props.enableRangeSelect && !props.pivotMode && rowGroups.value.length === 0)

// Row index ↔ finalDataForRendering. Only rows carrying `.data` are real copy
// targets; the count still drives geometry so empty filler rows map cleanly.
const rangeRowCount = computed<number>(() => finalDataForRendering.value.length)
const rangeRows = computed<Record<string, any>[]>(() => finalDataForRendering.value.map((r: any) => (r && r.data ? r.data : r)))

const rangeCopyFlow = useRangeCopyFlow({
    getActiveRange: () => rangeSelection.activeRange.value,
    getColumns: () => visibleColumns.value as unknown as { field: string; name: string }[],
    getRows: () => rangeRows.value,
    getTableName: () => props.table_info.name,
    ...(props.formatCopyValue ? { formatCopyValue: props.formatCopyValue } : {}),
    toastSuccess: (msg: string) => toast.success(msg),
    toastWarning: (msg: string) => toast.warning(msg),
    toastError: (msg: string) => toast.error(msg)
})

const rangeSelection = useTableRangeSelection({
    enabledRef: rangeSelectActive,
    visibleColumnsRef: computed(() => visibleColumns.value.map(c => ({ field: c.field, frozen: c.frozen }))),
    rowCountRef: rangeRowCount,
    rowHeightRef: computed(() => props.rowHeight),
    enableDynamicRowHeightRef: computed(() => props.enableDynamicRowHeight),
    // Use rowPositions (has the trailing sentinel positions[n] = bottom of last row)
    // not rowPositionsWithSpacing (length n, no sentinel) — range-coords.rangeHeight
    // reads positions[rowEnd+1]. Range-select only runs without grouping, so the two
    // agree on row tops; rowPositions is the one matching the geometry contract.
    rowPositionsRef: rowPositions,
    scrollContainerRef: dataGridMain,
    showCheckboxRef: computed(() => props.showCheckbox),
    getColumnWidth,
    scrollLeftRef: scrollLeft,
    scrollTopRef: scrollTop,
    viewportWidthRef: viewportWidth,
    containerHeightRef: containerHeight,
    frozenWidthRef: frozenWidth,
    onCopyRequest: () => rangeCopyFlow.handleCopyShortcut()
})

// field → column index within visibleColumns (frozen first, then non-frozen).
// Used to map a rendered cell back to range-selection coordinates.
const rangeColIndexByField = computed<Map<string, number>>(() => {
    const map = new Map<string, number>()
    visibleColumns.value.forEach((c, i) => map.set(c.field, i))
    return map
})

// Range-highlight class for a body cell. Painted on the cell itself (not an
// overlay) so frozen cells stay pinned on scroll without a translateX lag.
const rangeCellClass = (rowIndex: number, field: string) => {
    if (!rangeSelectActive.value) return null
    const col = rangeColIndexByField.value.get(field)
    if (col === undefined) return null
    const level = rangeSelection.cellRangeLevel(rowIndex, col)
    return level === 2 ? "range-cell range-cell--primary" : level === 1 ? "range-cell" : null
}

// Range-highlight class for a header cell (column is in a selected range).
const headerRangeClass = (field: string) => {
    if (!rangeSelectActive.value) return null
    const col = rangeColIndexByField.value.get(field)
    if (col === undefined) return null
    const level = rangeSelection.colRangeLevel(col)
    return level === 2 ? "range-col range-col--primary" : level === 1 ? "range-col" : null
}

// Header column handle: resolve a header column's index within visibleColumns.
const rangeColIndex = (field: string): number => visibleColumns.value.findIndex(c => c.field === field)
const onRangeHeaderMouseDown = (e: MouseEvent, field: string) => {
    if (!rangeSelectActive.value) return
    const idx = rangeColIndex(field)
    if (idx >= 0) rangeSelection.onHeaderMouseDown(e, idx)
}

const isColumnVisible = (field: string): boolean => {
    return visibleColumnFields.value.size === 0 || visibleColumnFields.value.has(field)
}

const toggleColumn = (field: string): void => {
    if (visibleColumnFields.value.has(field)) {
        visibleColumnFields.value.delete(field)
    } else {
        visibleColumnFields.value.add(field)
    }
    emit("column-toggle", {
        field,
        visible: visibleColumnFields.value.has(field)
    })
}

const getFieldLabel = (field: string): string => {
    const column = props.columns.find(col => col.field === field)
    return column ? column.name : field
}

// Hàm xử lý drag over
const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
}

const handleDragStart = (event: DragEvent, field: string, index?: number): void => {
    if (event.dataTransfer) {
        event.dataTransfer.setData("text/plain", field)
        event.dataTransfer.effectAllowed = "move"

        // Nếu đang kéo từ row groups
        if (index !== undefined) {
            draggedIndex.value = index
            draggedField.value = field
            // Thêm class dragging
            const element = event.target as HTMLElement
            element.classList.add("dragging")
        }
    }
}

// Hàm xử lý drag end
const handleDragEnd = () => {
    draggedIndex.value = null
    draggedField.value = null
    // Xóa class dragging
    const draggingElements = document.querySelectorAll(".dragging")
    draggingElements.forEach(el => el.classList.remove("dragging"))
}

// Hàm xử lý drag enter
const handleDragEnter = (index: number) => {
    if (draggedIndex.value !== null && draggedIndex.value !== index) {
        // Di chuyển item trong array
        const draggedItem = rowGroups.value[draggedIndex.value]
        if (draggedItem === undefined) return
        const newRowGroups = [...rowGroups.value]

        // Xóa item cũ
        newRowGroups.splice(draggedIndex.value, 1)

        // Chèn vào vị trí mới
        // Khi kéo từ trên xuống: draggedIndex < index
        // Sau khi xóa phần tử, các index phía dưới giảm 1, nên chèn vào index - 1
        // Khi kéo từ dưới lên: draggedIndex > index
        // Các index phía trên không thay đổi, nên chèn vào index
        newRowGroups.splice(index, 0, draggedItem)

        rowGroups.value = newRowGroups

        // Cập nhật draggedIndex để theo dõi vị trí mới
        draggedIndex.value = rowGroups.value.indexOf(draggedItem)

        // Sắp xếp lại thứ tự cột theo rowGroups mới
        updateColumnOrderByGroups()
        saveColumnState()
    }
}

// Hàm xử lý drag leave
const handleDragLeave = () => {
    // Có thể thêm logic nếu cần
}

const handleDrop = (event: DragEvent, target: string): void => {
    event.preventDefault()
    if (event.dataTransfer) {
        const field = event.dataTransfer.getData("text/plain")

        if (target === "rowGroups" && !rowGroups.value.includes(field)) {
            rowGroups.value.push(field)

            // Sắp xếp lại thứ tự cột - đưa các cột được group lên đầu
            updateColumnOrderByGroups()
            saveColumnState()
        }
    }
}

const removeFromRowGroups = (field: string): void => {
    const index = rowGroups.value.indexOf(field)
    if (index > -1) {
        rowGroups.value.splice(index, 1)

        // Sắp xếp lại thứ tự cột sau khi xóa khỏi group
        updateColumnOrderByGroups()
        saveColumnState()
    }
}

const toggleGroup = (id: string): void => {
    if (expandedGroups.value.has(id)) {
        expandedGroups.value.delete(id)
    } else {
        expandedGroups.value.add(id)
    }

    console.log(expandedGroups.value)
    console.log(groupedData.value)
}

const toggleSort = (field: string, direction: string): void => {
    // if (sortConfig.value.field === field) {
    //     if (sortConfig.value.direction === "asc") {
    //         sortConfig.value.direction = "desc"
    //     } else if (sortConfig.value.direction === "desc") {
    //         sortConfig.value.field = null
    //         sortConfig.value.direction = null
    //     } else {
    //         sortConfig.value.direction = "asc"
    //     }
    // } else {
    //     sortConfig.value.field = field
    //     sortConfig.value.direction = "asc"
    // }

    if (direction === "default") {
        sortConfig.value.field = null
        sortConfig.value.direction = null
    } else {
        sortConfig.value.field = field
        sortConfig.value.direction = direction === "asc" ? "asc" : "desc"
    }

    emit("sort-change", {
        field: sortConfig.value.field,
        direction: sortConfig.value.direction
    })
}

const getSortClass = (field: string): string => {
    if (sortConfig.value.field !== field) return ""
    return sortConfig.value.direction === "asc" ? "sort-asc" : "sort-desc"
}

const toggleSelectAll = (): void => {
    const ids_selected = currentData.value.filter(row => !("isGroup" in row)).map(row => String(row[props.table_info.key_id]))
    if (isAllSelected.value) {
        props.checkedConfig.selected = props.checkedConfig.selected.filter(id => !ids_selected.includes(id))
    } else {
        props.checkedConfig.selected = Array.from(new Set([...props.checkedConfig.selected, ...ids_selected]))
    }
}

const toggleRowSelection1 = (rowId: string): void => {
    if (props.checkedConfig.selected.includes(rowId)) {
        props.checkedConfig.selected = props.checkedConfig.selected.filter(id => id !== rowId)
    } else {
        props.checkedConfig.selected.push(rowId)
    }
}

// Scroll handling
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

const handleBodyScroll = (event: Event): void => {
    // Không cần đồng bộ scrollLeft cho header nữa
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
    if (scrollTimeout) {
        clearTimeout(scrollTimeout)
    }
    scrollTimeout = setTimeout(() => {
        if (containerHeight.value !== target.clientHeight) {
            containerHeight.value = target.clientHeight
        }
    }, 100)
}

// const handleMainScroll = (event: Event): void => {
//     const target = event.target as HTMLElement

//     // Cập nhật scrollTop cho virtual row
//     scrollTop.value = target.scrollTop

//     // Cập nhật scrollLeft cho virtual column
//     scrollLeft.value = target.scrollLeft

//     if (scrollTimeout) {
//         clearTimeout(scrollTimeout)
//     }

//     scrollTimeout = setTimeout(() => {
//         if (containerHeight.value !== target.clientHeight) {
//             containerHeight.value = target.clientHeight
//         }
//         if (viewportWidth.value !== target.clientWidth) {
//             viewportWidth.value = target.clientWidth
//         }
//     }, 100)
// }
let scrollRAF: number | null = null

const handleMainScroll = (event: Event): void => {
    if (scrollRAF) {
        cancelAnimationFrame(scrollRAF)
    }

    scrollRAF = requestAnimationFrame(() => {
        const target = event.target as HTMLElement

        // Cập nhật scrollTop và scrollLeft ngay lập tức
        scrollTop.value = target.scrollTop
        scrollLeft.value = target.scrollLeft

        // Debounce container size update
        if (scrollTimeout) {
            clearTimeout(scrollTimeout)
        }

        scrollTimeout = setTimeout(() => {
            if (containerHeight.value !== target.clientHeight) {
                containerHeight.value = target.clientHeight
            }
            if (viewportWidth.value !== target.clientWidth) {
                viewportWidth.value = target.clientWidth
            }
        }, 100)

        scrollRAF = null
    })
}

const handleHeaderScroll = (event: Event): void => {
    // Không làm gì cả
    return
}

const handleHeaderWheel = (event: WheelEvent): void => {
    // Không làm gì cả
    return
}

const handleScroll = (event: Event): void => {
    handleBodyScroll(event)
}

const startResize = (event: MouseEvent, column: Column): void => {
    resizingColumn.value = column
    startX.value = event.clientX
    startWidth.value = getColumnWidth(column.field)
    originalWidth.value = getColumnWidth(column.field)

    // Bắt đầu resize mode
    isResizing.value = true

    // Thêm class vào body để thay đổi cursor toàn cục
    document.body.classList.add("resizing-column")

    // Lưu vị trí ban đầu của edge bên phải của cột
    const columnElement = (event.currentTarget as HTMLElement)?.parentElement as HTMLElement
    if (columnElement) {
        const rect = columnElement.getBoundingClientRect()
        const containerRect = dataGridMain.value?.getBoundingClientRect()
        if (containerRect) {
            columnStartPosition.value = rect.right - containerRect.left + (dataGridMain.value?.scrollLeft || 0)
            previewPosition.value = columnStartPosition.value
        }
    }

    document.addEventListener("mousemove", handleResize)
    document.addEventListener("mouseup", stopResize)
}

const handleResize = (event: MouseEvent): void => {
    if (!resizingColumn.value) return

    const diff = event.clientX - startX.value
    let newWidth = Math.max(80, startWidth.value + diff)

    // Áp dụng giới hạn width cho cột đóng băng (chỉ trong non-pivot mode)
    if (!props.pivotMode && resizingColumn.value.frozen) {
        const maxWidth = getMaxColumnWidth.value(resizingColumn.value.field)
        newWidth = Math.min(newWidth, maxWidth)
    }

    // Cập nhật vị trí preview line = vị trí ban đầu + sự thay đổi width
    previewPosition.value = columnStartPosition.value + (newWidth - startWidth.value)
}

const stopResize = (): void => {
    if (!resizingColumn.value) return

    // Tính toán width mới dựa trên sự thay đổi vị trí preview
    let newWidth = Math.max(80, startWidth.value + (previewPosition.value - columnStartPosition.value))

    // Áp dụng giới hạn width cho cột đóng băng (chỉ trong non-pivot mode)
    if (!props.pivotMode && resizingColumn.value.frozen) {
        const maxWidth = getMaxColumnWidth.value(resizingColumn.value.field)
        newWidth = Math.min(newWidth, maxWidth)
    }

    // Áp dụng width mới
    columnWidths.value.set(resizingColumn.value.field, newWidth)
    resizingColumn.value.width = newWidth

    // Emit event khi resize
    emit("column-resize", {
        field: resizingColumn.value.field,
        width: newWidth,
        action: "resize"
    })

    // Reset resize state
    isResizing.value = false
    resizingColumn.value = null

    // Xóa class khỏi body
    document.body.classList.remove("resizing-column")

    document.removeEventListener("mousemove", handleResize)
    document.removeEventListener("mouseup", stopResize)

    saveColumnState()
}

const resetColumnWidth = async (column: Column): Promise<void> => {
    const defaultWidth = defaultColumnWidths.value.get(column.field) || DEFAULT_COL_WIDTH

    // console.log(`Resetting column "${column.name}" (${column.field})`)
    // console.log(`Current width: ${column.width}px`)
    // console.log(`Default width: ${defaultWidth}px`)
    // console.log(`All default widths:`, Object.fromEntries(defaultColumnWidths.value))

    // Sử dụng reactive state để đảm bảo Vue reactive
    columnWidths.value.set(column.field, defaultWidth)
    column.width = defaultWidth

    // Đợi Vue update DOM
    await nextTick()

    // console.log(`New width: ${column.width}px`)

    // Emit event để parent component có thể lắng nghe
    emit("column-resize", {
        field: column.field,
        width: defaultWidth,
        action: "reset"
    })

    saveColumnState()
}

// Frozen columns functionality
const toggleFreeze = (field: string): void => {
    const column = currentColumns.value.find(col => col.field === field)
    if (column) {
        column.frozen = !column.frozen
        if (column.frozen) {
            // Nếu đóng băng: thêm vào cuối danh sách frozen
            if (!frozenOrder.value.includes(field)) {
                frozenOrder.value.push(field)
            }

            // Cập nhật lại thứ tự cột: frozen columns trước, non-frozen columns sau
            const frozenFields = frozenOrder.value.filter(f => columnsApply.value.includes(f))
            const nonFrozenFields = columnsApply.value.filter(f => !frozenOrder.value.includes(f))
            columnsApply.value = [...frozenFields, ...nonFrozenFields]
        } else {
            // Nếu bỏ đóng băng: loại khỏi frozenOrder
            frozenOrder.value = frozenOrder.value.filter(f => f !== field)
        }

        updateFrozenPositions()
        saveColumnState()
    }
}

const getFrozenColumnLeft = (field: string, type: "header" | "body" | "footer", level: any, index: number = 0): number => {
    let left = 0
    if (props.showCheckbox) left += 60
    for (const col of visibleColumns.value) {
        if (col.field === field) break
        if (col.frozen) left += getColumnWidth(col.field)
    }

    // nếu là group
    if (level && rowGroups.value.length && index === 0) {
        left += level * 20
    }

    return left
}

const updateFrozenPositions = (): void => {
    // Không cần sắp xếp lại visibleColumns nữa, chỉ stripe cập nhật giao diện nếu cần
}

// Hàm sắp xếp lại thứ tự cột theo rowGroups
const updateColumnOrderByGroups = (): void => {
    // Lấy danh sách các cột được group
    const groupedFields = [...rowGroups.value]

    // Lấy danh sách các cột không được group
    const nonGroupedFields = columnsApply.value.filter(field => !groupedFields.includes(field))

    // Sắp xếp lại: cột được group lên đầu theo thứ tự trong rowGroups
    columnsApply.value = [...groupedFields, ...nonGroupedFields]

    // Cập nhật currentColumns để phản ánh thứ tự mới
    currentColumns.value.sort((a, b) => {
        const aIndex = columnsApply.value.indexOf(a.field)
        const bIndex = columnsApply.value.indexOf(b.field)
        return aIndex - bIndex
    })
}

const initializeFrozenColumns = (): void => {
    // currentColumns.value.forEach(column => {
    //     if (column.frozen === undefined) {
    //         column.frozen = false
    //     }
    //     // Lưu trữ default width nếu chưa có
    //     if (!defaultColumnWidths.value.has(column.field)) {
    //         defaultColumnWidths.value.set(column.field, column.width)
    //     }
    // })
    const config_column = localStorage.getItem("config_column") || "{}"
    const config = JSON.parse(config_column)
    const cols = config[`config_${props.table_info.name}`] || []

    // Seed frozenOrder from saved config; fall back to columns flagged frozen in props
    // (preserving their declared order). Without this, initially-frozen columns are absent
    // from frozenOrder, so freezing a new column pushes the existing ones to the end.
    const savedFrozen = cols.filter((col: any) => col.frozen).map((col: any) => col.field)
    frozenOrder.value = savedFrozen.length ? savedFrozen : props.columns.filter(col => col.frozen).map(col => col.field)

    props.columns.forEach((column, index) => {
        // Lưu trữ default width nếu chưa có
        if (!defaultColumnWidths.value.has(column.field)) {
            defaultColumnWidths.value.set(column.field, column.width)
        }

        const col_config = cols.find((col: any) => col.field === column.field)
        if (col_config) {
            column.frozen = col_config.frozen
            column.width = col_config.width
        }
    })

    // Cập nhật columnsApply theo thứ tự đã lưu từ localStorage
    if (cols.length > 0) {
        const savedOrder = cols.map((col: any) => col.field)
        const availableFields = columnsApply.value.filter((field: string) => savedOrder.includes(field))
        const newFields = columnsApply.value.filter((field: string) => !savedOrder.includes(field))

        // Sắp xếp theo thứ tự đã lưu, thêm các cột mới vào cuối
        columnsApply.value = [...savedOrder.filter((field: string) => availableFields.includes(field)), ...newFields]
    }
}

// Color highlighting methods
const applyColorRule = (): void => {
    if (isColorRuleValid.value) {
        const newRule = {
            id: Date.now(),
            column: colorRule.value.column,
            operator: colorRule.value.operator,
            value: colorRule.value.value,
            color: colorRule.value.color
        }

        colorRules.value.push(newRule)

        // Reset form
        colorRule.value = {
            column: "",
            operator: "",
            value: "",
            color: ""
        }

        console.log(`🎨 Applied color rule: ${newRule.column} ${newRule.operator} ${newRule.value} -> ${newRule.color}`)
    }
}

const clearColorRules = (): void => {
    colorRules.value = []
    console.log("🗑️ Cleared all color rules")
}

const checkCondition = (cellValue: any, rule: any): boolean => {
    const { operator, value } = rule
    const cellStr = String(cellValue || "").toLowerCase()
    const ruleStr = String(value).toLowerCase()
    const cellNum = parseFloat(cellValue)
    const ruleNum = parseFloat(value)

    switch (operator) {
        case "equals":
            return cellStr === ruleStr
        case "not_equals":
            return cellStr !== ruleStr
        case "greater":
            return !isNaN(cellNum) && !isNaN(ruleNum) && cellNum > ruleNum
        case "greater_equal":
            return !isNaN(cellNum) && !isNaN(ruleNum) && cellNum >= ruleNum
        case "less":
            return !isNaN(cellNum) && !isNaN(ruleNum) && cellNum < ruleNum
        case "less_equal":
            return !isNaN(cellNum) && !isNaN(ruleNum) && cellNum <= ruleNum
        case "contains":
            return cellStr.includes(ruleStr)
        case "not_contains":
            return !cellStr.includes(ruleStr)
        case "starts_with":
            return cellStr.startsWith(ruleStr)
        case "ends_with":
            return cellStr.endsWith(ruleStr)
        default:
            return false
    }
}

// Column settings functionality
const showColumnSettings = ref(false)
const showPivotColumnSettings = ref(false)
// allColumns giữ nguyên thứ tự gốc từ props để hiển thị trong CustomColumn
const allColumns = computed(() => {
    if (props.pivotMode) {
        return props.columns.filter(col => props.column_pivot.dimensions.includes(col.field) || props.column_pivot.metrics.includes(col.field))
    }
    return props.columns
})
const selectedColumns = ref<string[]>([])
// const frozenColumnsOrder = ref<string[]>(frozenOrder.value.filter(f => selectedColumns.value.includes(f)))

// const nonFrozenColumnsOrderDraft = ref<string[]>([])

// Pivot column settings
const selectedPivotDimensions = ref<string[]>([])
const selectedPivotMetrics = ref<string[]>([])

// Lưu trữ thứ tự chọn của dimensions và metrics
const pivotDimensionsOrder = ref<string[]>([])
const pivotMetricsOrder = ref<string[]>([])

// Computed để lấy danh sách dimensions và metrics từ props
const availablePivotDimensions = computed(() => {
    return props.columns
        .filter(col => col.is_dimension)
        .map(col => col.field)
        .sort((a, b) => a.localeCompare(b))
})

const availablePivotMetrics = computed(() => {
    return props.columns
        .filter(col => !col.is_dimension)
        .map(col => col.field)
        .sort((a, b) => a.localeCompare(b))
})

function openPivotColumnSettings() {
    // Khởi tạo selectedPivotDimensions và selectedPivotMetrics từ các cột đang hiển thị
    const currentVisibleColumns = Array.from(visibleColumnFields.value)

    // Phân loại các cột đang hiển thị thành dimensions và metrics
    selectedPivotDimensions.value = currentVisibleColumns.filter(col => props.column_pivot.dimensions.includes(col))
    selectedPivotMetrics.value = currentVisibleColumns.filter(col => props.column_pivot.metrics.includes(col))

    // Khởi tạo thứ tự chọn theo thứ tự hiển thị hiện tại
    pivotDimensionsOrder.value = [...selectedPivotDimensions.value]
    pivotMetricsOrder.value = [...selectedPivotMetrics.value]

    showPivotColumnSettings.value = true
}

// function handleColumnCheckboxChange(col: any, checked: boolean) {
//     if (checked && !selectedColumns.value.includes(col.field)) {
//         selectedColumns.value.push(col.field)
//         nonFrozenColumnsOrderDraft.value.push(col.field)
//     } else if (!checked) {
//         const idx = selectedColumns.value.indexOf(col.field)
//         if (idx !== -1) selectedColumns.value.splice(idx, 1)
//         const idxF = frozenColumnsOrder.value.indexOf(col.field)
//         if (idxF !== -1) frozenColumnsOrder.value.splice(idxF, 1)
//         const idxN = nonFrozenColumnsOrderDraft.value.indexOf(col.field)
//         if (idxN !== -1) nonFrozenColumnsOrderDraft.value.splice(idxN, 1)
//     }
// }

// function onColumnCheckboxChange(e: Event, col: any) {
//     const checked = (e.target && (e.target as HTMLInputElement).checked) || false
//     handleColumnCheckboxChange(col, checked)
// }
// function onColumnCheckboxChange(e: boolean, col: any) {
//     handleColumnCheckboxChange(col, e)
// }

// function handlePivotDimensionCheckboxChange(e: Event, dimension: string) {
//     const checked = (e.target && (e.target as HTMLInputElement).checked) || false
//     if (checked && !selectedPivotDimensions.value.includes(dimension)) {
//         selectedPivotDimensions.value.push(dimension)
//         // Thêm vào thứ tự chọn
//         pivotDimensionsOrder.value.push(dimension)
//     } else if (!checked) {
//         selectedPivotDimensions.value = selectedPivotDimensions.value.filter(d => d !== dimension)
//         // Xóa khỏi thứ tự chọn
//         pivotDimensionsOrder.value = pivotDimensionsOrder.value.filter(d => d !== dimension)
//     }
// }
function handlePivotDimensionCheckboxChange(e: boolean, dimension: string) {
    if (e && !selectedPivotDimensions.value.includes(dimension)) {
        selectedPivotDimensions.value.push(dimension)
        // Thêm vào thứ tự chọn
        pivotDimensionsOrder.value.push(dimension)
    } else if (!e) {
        selectedPivotDimensions.value = selectedPivotDimensions.value.filter(d => d !== dimension)
        // Xóa khỏi thứ tự chọn
        pivotDimensionsOrder.value = pivotDimensionsOrder.value.filter(d => d !== dimension)
    }
}

// function handlePivotMetricCheckboxChange(e: Event, metric: string) {
//     const checked = (e.target && (e.target as HTMLInputElement).checked) || false
//     if (checked && !selectedPivotMetrics.value.includes(metric)) {
//         selectedPivotMetrics.value.push(metric)
//         // Thêm vào thứ tự chọn
//         pivotMetricsOrder.value.push(metric)
//     } else if (!checked) {
//         selectedPivotMetrics.value = selectedPivotMetrics.value.filter(m => m !== metric)
//         // Xóa khỏi thứ tự chọn
//         pivotMetricsOrder.value = pivotMetricsOrder.value.filter(m => m !== metric)
//     }
// }
function handlePivotMetricCheckboxChange(e: boolean, metric: string) {
    if (e && !selectedPivotMetrics.value.includes(metric)) {
        selectedPivotMetrics.value.push(metric)
        // Thêm vào thứ tự chọn
        pivotMetricsOrder.value.push(metric)
    } else if (!e) {
        selectedPivotMetrics.value = selectedPivotMetrics.value.filter(m => m !== metric)
        // Xóa khỏi thứ tự chọn
        pivotMetricsOrder.value = pivotMetricsOrder.value.filter(m => m !== metric)
    }
}

const applyColumnSettings1 = (columns: string[], frozen_columns: string[], row_groups?: string[]) => {
    visibleColumnFields.value = new Set(columns)

    // Cập nhật rowGroups trước khi xử lý frozen
    if (row_groups !== undefined) {
        rowGroups.value = [...row_groups]
    }

    // Loại bỏ các cột bị ẩn khỏi rowGroups
    const hiddenColumns = currentColumns.value.filter(col => !columns.includes(col.field)).map(col => col.field)
    rowGroups.value = rowGroups.value.filter(field => !hiddenColumns.includes(field))

    // Tự động đóng băng và sắp xếp cột theo group
    const { finalFrozenOrder, finalColumnsOrder } = autoFreezeAndOrderColumns(columns, frozen_columns, rowGroups.value)

    frozenOrder.value = finalFrozenOrder
    columnsApply.value = finalColumnsOrder

    // Sắp xếp lại currentColumns theo thứ tự mới
    currentColumns.value.sort((a, b) => finalColumnsOrder.indexOf(a.field) - finalColumnsOrder.indexOf(b.field))
    currentColumns.value.forEach(col => {
        col.frozen = frozenOrder.value.includes(col.field)
    })

    showColumnSettings.value = false
    saveColumnState()
}

const applyPivotColumnSettings = () => {
    // Sử dụng thứ tự chọn để tạo danh sách cột hiển thị
    const allSelectedColumns = [...pivotDimensionsOrder.value, ...pivotMetricsOrder.value]

    // Cập nhật visibleColumnFields để chỉ hiển thị các cột đã chọn
    visibleColumnFields.value = new Set(allSelectedColumns)

    // Cập nhật columnsApply để áp dụng vào bảng
    columnsApply.value = allSelectedColumns

    // Tính tổng width của các cột dimensions đã chọn
    const dimensionsWidth = pivotDimensionsOrder.value.reduce((total, dimensionField) => {
        const column = currentColumns.value.find(col => col.field === dimensionField)
        return total + (column ? getColumnWidth(column.field) : DEFAULT_COL_WIDTH)
    }, 0)

    // Tính width của container (bao gồm checkbox và group column nếu có)
    const containerWidth = viewportWidth.value || 800
    const checkboxWidth = props.showCheckbox ? 60 : 0
    const groupWidth = hasGrouping.value ? 200 : 0
    const availableWidth = containerWidth - checkboxWidth - groupWidth

    // Kiểm tra nếu tổng width dimensions vượt quá 70% container width
    const maxAllowedWidth = availableWidth * 0.7

    if (dimensionsWidth > maxAllowedWidth) {
        // Nếu vượt quá 70%, không đóng băng các cột dimensions
        pivotDimensionsOrder.value.forEach(dimensionField => {
            const column = currentColumns.value.find(col => col.field === dimensionField)
            if (column) {
                column.frozen = false
                frozenOrder.value = frozenOrder.value.filter(f => f !== dimensionField)
            }
        })
    } else {
        // Nếu không vượt quá 70%, đóng băng các cột dimensions đã chọn
        pivotDimensionsOrder.value.forEach(dimensionField => {
            const column = currentColumns.value.find(col => col.field === dimensionField)
            if (column) {
                column.frozen = true
                if (!frozenOrder.value.includes(dimensionField)) {
                    frozenOrder.value.push(dimensionField)
                }
            }
        })
    }

    // Bỏ đóng băng các cột không phải dimensions
    pivotMetricsOrder.value.forEach(metricField => {
        const column = currentColumns.value.find(col => col.field === metricField)
        if (column) {
            column.frozen = false
            frozenOrder.value = frozenOrder.value.filter(f => f !== metricField)
        }
    })
    currentColumns.value.sort((a, b) => {
        if (pivotDimensionsOrder.value.includes(a.field) && pivotDimensionsOrder.value.includes(b.field)) {
            return pivotDimensionsOrder.value.indexOf(a.field) - pivotDimensionsOrder.value.indexOf(b.field)
        } else return 0
    })

    // Emit event để parent component có thể cập nhật pivotDimensions và pivotMetrics
    emit("pivot-columns-change", {
        dimensions: pivotDimensionsOrder.value,
        metrics: pivotMetricsOrder.value
    })

    showPivotColumnSettings.value = false
}

// Hàm tính tổng cho từng cột số đang hiển thị
function getColumnSums() {
    const sums: Record<string, number> = {}
    visibleColumns.value.forEach(col => {
        // Chỉ tính tổng cho cột kiểu number
        const total = filteredData.value.reduce((sum, row) => {
            const val = row[col.field]
            return typeof val === "number" ? sum + val : sum
        }, 0)
        sums[col.field] = total
    })
    return sums
}
const columnSums = computed(getColumnSums)

// 2. Tối ưu getCellColor: cache kết quả cho mỗi row/field
const cellColorMap = computed(() => {
    const map: Record<string, Record<string, string>> = {}
    for (const row of sortedData.value) {
        if (!row.data) continue
        const rowId = row.data.id
        map[rowId] = {}
        // Ưu tiên cell_format
        if (row.data.cell_format && typeof row.data.cell_format === "object") {
            for (const key in row.data.cell_format) {
                const color = row.data.cell_format[key]?.color
                if (color) map[rowId][key] = color
            }
        }
        // Rule-based color
        for (const rule of colorRules.value) {
            if (rule.column && checkCondition(row.data[rule.column], rule)) {
                map[rowId][rule.column] = rule.color
            }
        }
    }
    return map
})

const changePaging = (page: number, limit: number) => {
    emit("change-paging", { page, limit })
}

const deletePivotDimension = (dimension: string) => {
    selectedPivotDimensions.value = selectedPivotDimensions.value.filter(d => d !== dimension)
    pivotDimensionsOrder.value = pivotDimensionsOrder.value.filter(d => d !== dimension)
}

onBeforeMount(() => {
    // Initialize frozen columns
    initializeFrozenColumns()
})

// Initialize
onMounted(async () => {
    await nextTick()
    initializePivotState()

    // Ưu tiên sử dụng data-grid-main nếu có
    const scrollContainer = dataGridMain.value || gridBody.value

    if (scrollContainer) {
        containerHeight.value = scrollContainer.clientHeight
        viewportWidth.value = scrollContainer.clientWidth

        // Thêm event listener cho scroll container chính
        scrollContainer.addEventListener("scroll", e => {
            if (scrollContainer) {
                // Không cần thêm logic ở đây, handleMainScroll sẽ xử lý
            }
        })

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                requestAnimationFrame(() => {
                    const newHeight = entry.contentRect.height
                    if (newHeight !== containerHeight.value) {
                        containerHeight.value = newHeight
                    }
                    const newWidth = entry.contentRect.width
                    if (newWidth !== viewportWidth.value) {
                        viewportWidth.value = newWidth
                    }
                })
            }
        })
        resizeObserver.observe(scrollContainer)
    }

    // Initialize visible columns từ columnsApply (đã load từ localStorage)
    columnsApply.value.forEach(field => {
        visibleColumnFields.value.add(field)
    })

    // Initialize widths cho tất cả columns
    currentColumns.value.forEach(col => {
        // Chỉ lưu default width nếu chưa có
        if (!defaultColumnWidths.value.has(col.field)) {
            defaultColumnWidths.value.set(col.field, col.width || DEFAULT_COL_WIDTH)
            // console.log(`Saved default width for ${col.field}: ${col.width}px`)
        }
        // Khởi tạo columnWidths với default values
        if (!columnWidths.value.has(col.field)) {
            columnWidths.value.set(col.field, col.width || DEFAULT_COL_WIDTH)
        }
    })

    // // Initialize frozen columns
    // initializeFrozenColumns()

    // Tự động đóng băng các cột dimensions nếu ở pivot mode
    updatePivotColumnFreezingAfter()

    // Reset header position on mount
    if (gridHeader.value) {
        gridHeader.value.scrollLeft = 0
    }

    // Thêm event listener cho ESC key
    document.addEventListener("keydown", handleKeyDown)

    // Range-select global listeners (keydown for Cmd+C/ESC, document mousedown
    // for click-outside clear). Body/header mousedown wired in the template.
    rangeSelection.attachGlobalListeners()

    // console.log("All default widths on mount:", Object.fromEntries(defaultColumnWidths.value))

    // testConfigWidthTool();

    // // Thêm ResizeObserver cho window để cập nhật toolbar
    // const windowResizeObserver = new ResizeObserver(() => {
    //     // Debounce để tránh gọi quá nhiều lần
    //     if (windowResizeTimeout) {
    //         clearTimeout(windowResizeTimeout);
    //     }
    //     windowResizeTimeout = setTimeout(() => {
    //         testConfigWidthTool();
    //     }, 100);
    // });

    // // Theo dõi thay đổi kích thước của toolbarRight
    // if (toolbarRight.value) {
    //     windowResizeObserver.observe(toolbarRight.value);
    // }

    // // Theo dõi thay đổi kích thước window
    // window.addEventListener("resize", () => {
    //     if (windowResizeTimeout) {
    //         clearTimeout(windowResizeTimeout);
    //     }
    //     windowResizeTimeout = setTimeout(() => {
    //         testConfigWidthTool();
    //     }, 100);
    // });
})

// Cleanup
onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown)
    rangeSelection.detachGlobalListeners()
    // Khôi phục body overflow nếu đang ở fullscreen
    if (isFullscreen.value) {
        document.body.style.overflow = ""
    }

    // Clear timeout nếu có
    if (windowResizeTimeout) {
        clearTimeout(windowResizeTimeout)
    }
})

// Watch for data changes
watch(
    () => props.data,
    () => {
        selectedRows.value.clear()
    },
    { deep: true }
)

// Watch for column changes
watch(
    () => props.columns,
    () => {
        // Không clear visibleColumnFields khi columns thay đổi
        // Chỉ cập nhật default widths cho columns mới
        currentColumns.value.forEach(col => {
            // Chỉ lưu default width nếu chưa có
            if (!defaultColumnWidths.value.has(col.field)) {
                defaultColumnWidths.value.set(col.field, col.width || DEFAULT_COL_WIDTH)
                console.log(`Saved default width for ${col.field}: ${col.width}px`)
            }
            // Khởi tạo columnWidths với default values
            if (!columnWidths.value.has(col.field)) {
                columnWidths.value.set(col.field, col.width || DEFAULT_COL_WIDTH)
            }
        })
        initializeFrozenColumns()

        // Tự động đóng băng các cột dimensions nếu ở pivot mode
        updatePivotColumnFreezingAfter()
    },
    { deep: true }
)

watch(
    () => props.showCheckbox,
    val => {
        if (val && currentColumns.value.length > 0) {
            // currentColumns.value[0].frozen = true
        }
    },
    { immediate: true }
)

// Thêm hàm tính màu nền cho cell/hàng
function getCellBackground(row: any, column: any, rowIndex: number): string {
    // Ưu tiên cell_format
    if (row?.data && row.data.cell_format && row.data.cell_format[column.field]?.color) {
        return row.data.cell_format[column.field].color
    }
    // Ưu tiên rule
    if (row?.data && colorRules.value && Array.isArray(colorRules.value)) {
        for (const rule of colorRules.value) {
            if (rule.column === column.field && checkCondition(row.data[column.field], rule)) {
                return rule.color
            }
        }
    }
    // pivotMode: áp dụng cho tất cả cell (dimension + metrics)
    if (props.pivotMode) {
        // Đếm số cấp tối đa trong visibleRows
        let maxLevel = 0
        for (const r of visibleRows.value) {
            if (typeof r.level === "number" && r.level > maxLevel) maxLevel = r.level
        }
        const level = row.level ?? 1
        if (maxLevel >= 3) {
            if (level === 1) return maxLevel >= 4 ? "var(--accent)" : "var(--muted)"
            if (level === 2 && maxLevel >= 4) return "var(--muted)"
            return "var(--background)"
        } else {
            // 2 cấp hoặc ít hơn
            return "var(--background)"
        }
    }
    // Nếu là cột frozen (không pivotMode)
    if (column.frozen && props.stripe) {
        return rowIndex % 2 === 0 ? "var(--background)" : "var(--muted)"
    }
    // Mặc định
    return ""
}

const emptySpaceWidth = computed(() => {
    return Math.max(0, viewportWidth.value - totalTableWidth.value)
})

// Thêm computed để tính toán container width và kiểm tra điều kiện hiển thị nút freeze
const containerWidth = computed(() => {
    return viewportWidth.value || 800
})

const maxFrozenWidth = computed(() => {
    const checkboxWidth = props.showCheckbox ? 60 : 0
    const groupWidth = hasGrouping.value ? 200 : 0
    const availableWidth = containerWidth.value - checkboxWidth - groupWidth
    return availableWidth * 0.7
})

const canShowFreezeButton = computed(() => (columnField: string) => {
    if (props.pivotMode) return true // Luôn hiển thị trong pivot mode

    const currentFrozenWidth = frozenWidth.value
    const columnWidth = getColumnWidth(columnField)

    // Nếu cột đã đóng băng, kiểm tra xem có thể bỏ đóng băng không
    if (frozenColumns.value.some(col => col.field === columnField)) {
        return true // Luôn cho phép bỏ đóng băng
    }

    // Nếu cột chưa đóng băng, kiểm tra xem có thể đóng băng không
    return currentFrozenWidth + columnWidth <= maxFrozenWidth.value
})

const getMaxColumnWidth = computed(() => (columnField: string) => {
    if (props.pivotMode) return Infinity // Không giới hạn trong pivot mode

    const currentFrozenWidth = frozenWidth.value
    const columnWidth = getColumnWidth(columnField)

    // Nếu cột không đóng băng, không giới hạn
    if (!frozenColumns.value.some(col => col.field === columnField)) {
        return Infinity
    }

    // Nếu cột đã đóng băng, giới hạn width
    const otherFrozenWidth = currentFrozenWidth - columnWidth
    return maxFrozenWidth.value - otherFrozenWidth
})

// Hàm format cell cho pivot mode
const formatPivotCellValue = (row: RowData, columnField: string): any => {
    // Nếu là hàng summary và cột không phải dimension đầu tiên, có thể hiển thị 'Tất cả'
    if (row.isSummary) {
        const dimensionIndex = props.column_pivot.dimensions.indexOf(columnField)
        if (dimensionIndex > row.level!) {
            return "Tất cả"
        }
    }

    return row[columnField]
}

// Fullscreen functionality
const toggleFullscreen = (): void => {
    isFullscreen.value = !isFullscreen.value

    // Xử lý scroll position khi toggle
    if (isFullscreen.value) {
        // Khi vào fullscreen, có thể lưu scroll position hiện tại
        document.body.style.overflow = "hidden"
    } else {
        // Khi thoát fullscreen, khôi phục scroll
        document.body.style.overflow = ""
    }
}

// Xử lý phím ESC để thoát fullscreen
const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && isFullscreen.value) {
        toggleFullscreen()
    }
}

// lưu trạng thái cột lên local storage
const saveColumnState = () => {
    if (!props.table_info.name) return console.log("Vui lòng đặt tên cho bảng")

    // Lưu theo thứ tự: frozen columns trước, non-frozen columns sau
    const frozenFields = frozenOrder.value.filter((f: string) => columnsApply.value.includes(f))
    const nonFrozenFields = columnsApply.value.filter((f: string) => !frozenOrder.value.includes(f))
    const orderedFields = [...frozenFields, ...nonFrozenFields]

    const columns = orderedFields.map((field: string) => {
        return {
            field,
            width: getColumnWidth(field),
            frozen: frozenOrder.value.includes(field)
        }
    })

    let config_column = localStorage.getItem("config_column") || "{}"
    let config = JSON.parse(config_column)
    config[`config_${props.table_info.name}`] = columns
    localStorage.setItem("config_column", JSON.stringify(config))
}

// const image = (file_name: string) => {
//   return require(`@/assets/images/table/${file_name}`);
// };

// const testConfigWidthTool = () => {
//     // console.log(toolbarRight.value?.scrollWidth)
//     // console.log(toolbarRight.value?.offsetWidth)

//     // lấy ra danh sách phần tử con của toolbarRight
//     const elements = toolbarRight.value?.children;
//     const toolbarWidth = (toolbarRight.value?.offsetWidth || 0) - 100;

//     if (!elements || toolbarWidth === 0) return;

//     const list_child = Array.from(elements).map((element: any) => {
//         const input = element.querySelector("input");
//         return {
//             width: element.offsetWidth,
//             el: element,
//             width_after_resize: input ? element.offsetWidth : 40
//         };
//     });

//     // Tính tổng width hiện tại
//     const totalCurrentWidth = list_child.reduce((sum, item) => sum + item.width, 0);
//     // console.log("Total current width:", totalCurrentWidth)
//     // console.log("Toolbar width:", toolbarWidth)

//     // Nếu tổng width hiện tại <= toolbarWidth, khôi phục width ban đầu
//     if (totalCurrentWidth <= toolbarWidth) {
//         console.log("Restoring original widths");
//         list_child.forEach((item: any) => {
//             if (item.el.tagName === "BUTTON") {
//                 const span = item.el.querySelector("span");
//                 const button = item.el.querySelector("button");
//                 const input = item.el.querySelector("input");

//                 if (input) return; // Bỏ qua nếu có input bên trong

//                 // Khôi phục width ban đầu về max-content
//                 item.el.style.width = "max-content";
//                 if (span) {
//                     span.style.display = "";
//                 }
//                 if (button) {
//                     button.style.width = "max-content";
//                 }
//             }
//         });
//         return;
//     }

//     // Tính toán từ phải sang trái để tìm phần tử nào cần resize
//     let cumulativeWidth = 0;
//     const elementsToResize = [];

//     // Duyệt từ phải sang trái để tìm phần tử nào gây ra overflow
//     for (let i = list_child.length - 1; i >= 0; i--) {
//         const item = list_child[i];
//         const input = item.el.querySelector("input");

//         // Nếu có input, giữ nguyên width
//         if (input) {
//             cumulativeWidth += item.width;
//         } else {
//             // Nếu không có input, tính width sau resize
//             const widthAfterResize = 40;
//             cumulativeWidth += widthAfterResize;
//         }

//         // Nếu cumulativeWidth vượt quá toolbarWidth, phần tử này và các phần tử trước cần resize
//         if (cumulativeWidth > toolbarWidth) {
//             // Thêm tất cả phần tử từ vị trí này trở về trước vào danh sách resize
//             for (let j = i; j >= 0; j--) {
//                 const prevItem = list_child[j];
//                 const prevInput = prevItem.el.querySelector("input");

//                 // Chỉ resize button không có input
//                 if (prevItem.el.tagName === "BUTTON" && !prevInput) {
//                     elementsToResize.push(prevItem);
//                 }
//             }
//             break;
//         }
//     }

//     // console.log("Elements to resize:", elementsToResize.length)
//     // console.log("Cumulative width:", cumulativeWidth)

//     // Resize các phần tử được chọn
//     elementsToResize.forEach((item: any) => {
//         const input = item.el.querySelector("input");

//         if (item.el.tagName === "BUTTON" && !input) {
//             // Resize button không có input
//             const span = item.el.querySelector("span");
//             const button = item.el.querySelector("button");

//             item.el.style.width = "40px";
//             if (span) {
//                 span.style.display = "none";
//             }
//             if (button) {
//                 button.style.width = "40px";
//             }
//         }
//     });
// };

// Hàm tự động đóng băng và sắp xếp cột theo group
const autoFreezeAndOrderColumns = (columns: string[], existingFrozen: string[], groupColumns: string[]) => {
    // Get container width to calculate 70% limit
    const containerWidth = dataGridMain.value?.clientWidth || 1000
    const maxFrozenWidth = containerWidth * 0.7

    // Tạo danh sách cột theo thứ tự mới: group columns đầu tiên, sau đó là cột khác
    const nonGroupColumns = columns.filter(field => !groupColumns.includes(field))
    const finalColumnsOrder = [...groupColumns, ...nonGroupColumns]

    // Tính width cho từng cột
    let currentWidth = 0
    const finalFrozenOrder: string[] = []

    // Thêm checkbox width nếu có
    if (props.showCheckbox) {
        currentWidth += 60
    }

    // Đóng băng các cột group theo thứ tự (từ trái qua phải)
    for (const field of groupColumns) {
        const columnWidth = getColumnWidth(field)
        if (currentWidth + columnWidth <= maxFrozenWidth) {
            finalFrozenOrder.push(field)
            currentWidth += columnWidth
        } else {
            break // Dừng nếu vượt quá 70%
        }
    }

    // Thêm các cột đã được đóng băng trước đó (không phải group columns)
    const previouslyFrozen = existingFrozen.filter(field => !groupColumns.includes(field) && columns.includes(field))

    for (const field of previouslyFrozen) {
        const columnWidth = getColumnWidth(field)
        if (currentWidth + columnWidth <= maxFrozenWidth && !finalFrozenOrder.includes(field)) {
            finalFrozenOrder.push(field)
            currentWidth += columnWidth
        } else {
            break // Dừng nếu vượt quá 70%
        }
    }

    return {
        finalFrozenOrder,
        finalColumnsOrder
    }
}

const refreshData = (): void => {
    if (props.loading) return
    emit("refresh")
}

const checkEndGroup = (row: any, index: number) => {
    if (index === 0) return true

    function incrementSecondLastAndRemoveLast(str: string) {
        // Tách chuỗi bằng dấu "_"
        const parts = str.split("_")
        // Kiểm tra nếu có ít nhất 2 phần tử
        if (parts.length < 2) return str // Trả về chuỗi gốc nếu không đủ phần tử
        // Lấy số gần cuối, tăng lên 1 và loại bỏ phần tử cuối
        const secondLastIndex = parts.length - 2
        const secondLastNumber = parseInt(parts[secondLastIndex] ?? "", 10)
        parts[secondLastIndex] = (secondLastNumber + 1).toString()
        // Loại bỏ phần tử cuối
        parts.pop()
        // Ghép lại thành chuỗi
        return parts.join("_")
    }
    // Để số cuối giữ nguyên
    return !visibleRows.value.find(x => x.id.startsWith(incrementSecondLastAndRemoveLast(row.id))) && row.endGroups && row.endGroups.includes(index + 1)
}
</script>

<style scoped>
/* Component specific styles can go here if needed */
.column-settings-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--background);
    border-radius: 10px;
    box-shadow: 0 2px 24px rgba(0, 0, 0, 0.18);
    padding: 0;
    z-index: 1000;
    min-width: 700px;
    min-height: 480px;
    display: flex;
    flex-direction: column;
}
.popup-columns {
    display: flex;
    gap: 0;
    height: 500px;
}
.left {
    flex: 1.2;
    border-right: 1px solid var(--border);
    background: var(--muted);
    padding: 24px 0 24px 24px;
    display: flex;
    flex-direction: column;
}
.left-title {
    font-weight: 600;
    margin-bottom: 12px;
    font-size: 15px;
}
.column-list-scroll {
    overflow-y: auto;
    flex: 1;
    padding-right: 8px;
}
.column-checkbox-item {
    margin-bottom: 10px;
}
.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;
}
.right {
    flex: 1.8;
    padding: 24px;
    display: flex;
    flex-direction: column;
}
.right-title {
    font-weight: 600;
    margin-bottom: 12px;
    font-size: 15px;
}
.frozen-nonfrozen-wrap {
    display: flex;
    gap: 24px;
    height: 340px;
}
.frozen-list-wrap,
.nonfrozen-list-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.frozen-title,
.nonfrozen-title {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 8px;
}
.frozen-columns-list,
.nonfrozen-columns-list {
    background: var(--muted);
    border-radius: 8px;
    border: 1px solid var(--border);
    min-height: 260px;
    max-height: 320px;
    overflow-y: auto;
    padding: 12px 0;
}
.selected-column-item {
    display: flex;
    align-items: center;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin: 0 16px 10px 16px;
    padding: 8px 12px;
    font-size: 14px;
    gap: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    position: relative;
}
.drag-handle {
    cursor: grab;
    font-size: 18px;
    color: var(--muted-foreground);
    margin-right: 6px;
}
.remove-btn {
    background: none;
    border: none;
    color: var(--destructive);
    font-size: 18px;
    margin-left: auto;
    cursor: pointer;
    padding: 0 4px;
}
.column-settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 18px 32px 18px 0;
    border-top: 1px solid var(--border);
    background: var(--muted);
}
.apply-btn {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    font-weight: 500;
    cursor: pointer;
}
.cancel-btn {
    background: var(--muted);
    color: var(--foreground);
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    cursor: pointer;
}
.grid-footer-sum {
    display: flex;
    align-items: center;
    background: var(--muted);
    border-top: 1px solid var(--border);
    font-weight: 600;
    color: var(--foreground);
    position: sticky;
    bottom: 0;
    z-index: 10;
    min-height: 60px;
}
.footer-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 12px;
    height: 100%;
    font-size: 14px;
    border-right: 1px solid var(--border);
    background: var(--muted);
}

.footer-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.footer-cell.frozen-column {
    position: sticky;
    background: var(--muted);
    z-index: 100;
    left: 0;
    /* Có thể thêm border hoặc shadow nếu muốn nổi bật */
}
.header-cell,
.row-cell {
    /* border-top: 1px solid #f0f0f0; */
}
.grid-header-container {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--background);
    /* KHÔNG sticky theo chiều ngang, KHÔNG left/right */
}
.header-cell.frozen-column,
.row-cell.frozen-column {
    position: sticky;
    /* sticky chỉ theo left, không top */
    z-index: 100;
    /* box-shadow: 2px 0 4px -2px #e0e0e0; */
}
.header-cell.checkbox-cell.frozen-column,
.row-cell.checkbox-cell.frozen-column {
    position: sticky;
    left: 0;
    z-index: 110;
}
.last-frozen-column {
    overflow: visible;
}
.show-shadow.last-frozen-column::after {
    width: 5px;
}
.last-frozen-column::after {
    content: "";
    height: 100%;
    position: absolute;
    right: -1px;
    width: 0px;
    transform: translateX(100%);
    transition: all 0.3s;
    pointer-events: none;
    background: 0 0 url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABCAYAAAD5PA/NAAAAFklEQVQIHWPSkNeSBmJhTQVtbiDNCgASagIIuJX8OgAAAABJRU5ErkJggg==) repeat-y;
}

.cell-align-left {
    justify-content: flex-start !important;
    text-align: left !important;
}
.cell-align-center {
    justify-content: center !important;
    text-align: center !important;
}
.cell-align-right {
    justify-content: flex-end !important;
    text-align: right !important;
}

/* --- Virtual Non-Frozen Cells --- */
.non-frozen-cell {
    position: absolute !important;
    height: 100% !important;
}

/* --- Resize Preview Line --- */
.resize-preview-line {
    position: absolute;
    top: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(to bottom, var(--primary), var(--primary));
    z-index: 1000;
    pointer-events: none;
}

/* --- Column Resizer Cursor --- */
.column-resizer {
    cursor: col-resize;
}

/* Body cursor during resize */
body.resizing-column {
    cursor: col-resize !important;
    user-select: none;
}

.field-chip {
    cursor: move;
    transition: all 0.2s ease;
    width: 100%;
}

.field-chip:hover {
    background-color: var(--border);
}

.field-chip.dragging {
    opacity: 0.5;
    background: var(--primary);
}

.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}

.pivot-cell-content {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
}

.pivot-indent {
    display: inline-block;
    height: 100%;
    flex-shrink: 0;
}

.pivot-toggle-icon {
    display: inline-block;
    width: 20px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out;
    user-select: none;
    flex-shrink: 0;
    text-align: center;
    color: var(--muted-foreground);
}

.pivot-toggle-icon.expanded {
    transform: rotate(90deg);
}

.pivot-summary-row .row-cell {
    /* font-weight: 600; */
    background-color: var(--muted); /* Màu nền cho hàng tổng hợp */
}

/* Pivot Column Settings Styles */
.pivot-section {
    margin-bottom: 20px;
}

.pivot-section-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--foreground);
    margin-bottom: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
}

.pivot-selected-wrap {
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 340px;
}

.pivot-selected-section {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.pivot-selected-title {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 8px;
    color: var(--foreground);
}

.pivot-selected-list {
    background: var(--muted);
    border-radius: 8px;
    border: 1px solid var(--border);
    min-height: 120px;
    max-height: 150px;
    overflow-y: auto;
    padding: 12px 0;
    flex: 1;
}

.selected-pivot-item {
    display: flex;
    align-items: center;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin: 0 16px 8px 16px;
    padding: 8px 12px;
    font-size: 14px;
    gap: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    position: relative;
}

.selected-pivot-item .remove-btn {
    background: none;
    border: none;
    color: var(--destructive);
    font-size: 18px;
    margin-left: auto;
    cursor: pointer;
    padding: 0 4px;
}

.empty-space-cell {
    /* border: none !important; */
    pointer-events: none;
    flex-shrink: 0;
    border-top: 1px solid var(--border);
}

.header-empty-absolute {
    position: absolute !important;
    top: 0;
    bottom: 0;
    z-index: 1;
}

.zoom-icon {
    font-size: 16px;
}

/* Fullscreen styles */
.data-grid-container.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 49;
    background: white;
    margin: 0;
    border: 0;
}

.data-grid-container.fullscreen-mode .data-grid-content {
    height: 100%;
}
</style>
