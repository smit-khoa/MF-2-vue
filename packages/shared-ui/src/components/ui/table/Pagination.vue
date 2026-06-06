<template>
  <div id="scron_dropdown" class="pagination">
    <div class="pagination-left">
      <span class="pagination-desc">Hiển thị:</span>
      <Select :model-value="String(paging.limit)" @update:model-value="onLimitChange">
        <SelectTrigger size="sm" class="w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="item in displayPage" :key="item.value" :value="String(item.value)">
            {{ item.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <span class="pagination-desc">mỗi trang</span>
    </div>

    <div class="pagination-right">
      <span class="pagination-desc">{{
        `${paging.total ? paging.limit * (paging.page - 1) + 1 : 0}-${
          paging.limit * paging.page
        } / ${
          paging.total ? paging.total.toLocaleString() : 0
        } ${paginationText}`
      }}</span>
      <div class="pagination-horizontal">
        <a
          href="#"
          class="pagination-box flex-center"
          @click="changePage($event, paging.page - 1, 'pre')"
          :class="paging.page === 1 ? 'pagination-disable' : ''"
        >
          <Icon name="left" :size="18" />
        </a>

        <a
          href="#"
          class="pagination-box flex-center"
          @click="changePage($event, paging.page + 1, 'next')"
          :class="paging.has_next_page ? '' : 'pagination-disable'"
        >
          <Icon name="right" :size="18" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../select";
import { Icon } from "../../../icons";

// Props
const props = defineProps({
  paging: {
    type: Object,
    default: () => ({
      page: 1,
      limit: 25,
      total: 0,
      has_next_page: false,
    }),
  },
  paginationText: {
    type: String,
    default: "",
  },
});

// Emits
const emit = defineEmits(["changePage"]);

// Rows-per-page options.
const displayPage = ref([
  { label: "15", value: 15 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
  { label: "500", value: 500 },
  { label: "1000", value: 1000 },
  { label: "2000", value: 2000 },
]);

const changePage = (e: MouseEvent, page: number, isNext: "next" | "pre") => {
  e.preventDefault();
  if (isNext === "next" && !props.paging.has_next_page) return;
  if (isNext === "pre" && props.paging.page === 1) return;

  props.paging.page = page;
  emit("changePage", props.paging.page, props.paging.limit);
};

// Select emits the value as string; reset to page 1 when page size changes.
const onLimitChange = (value: any) => {
  const limit = Number(value);
  if (!limit || props.paging.limit === limit) return;

  props.paging.page = 1;
  props.paging.limit = limit;
  emit("changePage", props.paging.page, props.paging.limit);
};
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  height: 44px;
  border-top: 1px solid var(--border);
}
.pagination-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pagination-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pagination-horizontal {
  display: flex;
  align-items: center;
}
.pagination-desc {
  color: var(--muted-foreground);
  font-size: 14px;
  line-height: 20px;
}
.pagination-list {
  display: flex;
  align-items: center;
}
.pagination-list a {
  width: 24px;
  height: 20px;
  color: var(--muted-foreground);
  font-family: "InterTight", sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  text-decoration: none;
}
.pagination-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  color: var(--foreground);
  transition: all 0.2s linear;
}
.pagination-box:hover {
  background: var(--accent);
  color: var(--accent-foreground);
}
.pagination-disable {
  user-select: none;
  cursor: not-allowed;
  color: var(--muted-foreground);
  opacity: 0.5;
}
.pagination-disable:hover {
  background: none !important;
}
</style>
