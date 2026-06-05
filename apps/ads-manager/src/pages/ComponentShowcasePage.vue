<script setup lang="ts">
// Showcase page: renders every shared shadcn-vue component group so the design
// system can be eyeballed in one place. Standalone-only demo (imported by App.vue).
import { ref } from 'vue';
import {
  // Layout / display
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction,
  Badge, Separator, Skeleton,
  Avatar, AvatarImage, AvatarFallback,
  // Actions
  Button,
  // Form controls
  Input, Textarea, Label, Checkbox, Switch,
  RadioGroup, RadioGroupItem,
  Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem,
  // Overlays
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Popover, PopoverTrigger, PopoverContent,
  Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose,
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuItem, DropdownMenuCheckboxItem,
  // Navigation / data
  Tabs, TabsList, TabsTrigger, TabsContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
  Pagination, PaginationContent, PaginationFirst, PaginationPrevious,
  PaginationItem, PaginationEllipsis, PaginationNext, PaginationLast,
  // Feedback
  Toaster, toast,
  // Icons
  Icon, ICON_NAMES,
} from '@mf2/shared-ui';

// --- reactive state for interactive demos ---
const inputValue = ref('Xin chào SMIT');
const textareaValue = ref('');
const checkbox1 = ref(true);
const switch1 = ref(false);
const radioValue = ref('comfortable');
const selectValue = ref('');
const dropdownChecked = ref(true);
const currentPage = ref(1);

const buttonVariants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const buttonSizes = ['sm', 'default', 'lg'] as const;
const badgeVariants = ['default', 'secondary', 'destructive', 'outline'] as const;

const tableRows = [
  { id: 'CMP-001', name: 'Chiến dịch Tết 2026', status: 'Đang chạy', budget: '120.000.000đ' },
  { id: 'CMP-002', name: 'Brand Awareness Q2', status: 'Tạm dừng', budget: '80.000.000đ' },
  { id: 'CMP-003', name: 'Retargeting Web', status: 'Đang chạy', budget: '45.000.000đ' },
];
</script>

<template>
  <div class="min-h-screen bg-background p-6 text-foreground md:p-10">
    <!-- Toaster mount point (renders fixed-position toasts) -->
    <Toaster rich-colors position="top-right" />

    <header class="mx-auto mb-10 max-w-5xl">
      <h1 class="text-3xl font-bold">Shared UI — Component Showcase</h1>
      <p class="mt-1 text-muted-foreground">
        Toàn bộ component dùng chung (shadcn-vue / reka-ui) trong <code>@mf2/shared-ui</code>.
      </p>
    </header>

    <div class="mx-auto flex max-w-5xl flex-col gap-10">
      <!-- ============ BUTTON ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Button</h2>
        <div class="flex flex-wrap items-center gap-3">
          <Button v-for="v in buttonVariants" :key="v" :variant="v">{{ v }}</Button>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button v-for="s in buttonSizes" :key="s" :size="s">size: {{ s }}</Button>
          <Button size="icon"><Icon name="plus" :size="16" /></Button>
          <Button disabled>disabled</Button>
          <Button><Icon name="download" :size="16" /> Có icon</Button>
        </div>
      </section>

      <!-- ============ BADGE ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Badge</h2>
        <div class="flex flex-wrap items-center gap-3">
          <Badge v-for="v in badgeVariants" :key="v" :variant="v">{{ v }}</Badge>
          <Badge><Icon name="check" :size="12" /> Có icon</Badge>
        </div>
      </section>

      <!-- ============ CARD ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Card</h2>
        <Card class="max-w-sm">
          <CardHeader>
            <CardTitle>Tổng chi tiêu</CardTitle>
            <CardDescription>30 ngày gần nhất</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm"><Icon name="more-horizontal" :size="16" /></Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">245.000.000đ</p>
            <p class="text-sm text-muted-foreground">+12% so với kỳ trước</p>
          </CardContent>
          <CardFooter>
            <Button class="w-full">Xem chi tiết</Button>
          </CardFooter>
        </Card>
      </section>

      <!-- ============ INPUT / TEXTAREA / LABEL ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Input / Textarea / Label</h2>
        <div class="grid max-w-md gap-4">
          <div class="grid gap-2">
            <Label for="demo-input">Tên chiến dịch</Label>
            <Input id="demo-input" v-model="inputValue" placeholder="Nhập tên..." />
            <p class="text-sm text-muted-foreground">Giá trị: {{ inputValue }}</p>
          </div>
          <div class="grid gap-2">
            <Label for="demo-input-disabled">Disabled</Label>
            <Input id="demo-input-disabled" disabled placeholder="Không sửa được" />
          </div>
          <div class="grid gap-2">
            <Label for="demo-textarea">Ghi chú</Label>
            <Textarea id="demo-textarea" v-model="textareaValue" placeholder="Nhập ghi chú..." />
          </div>
        </div>
      </section>

      <!-- ============ CHECKBOX / SWITCH / RADIO ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Checkbox / Switch / Radio Group</h2>
        <div class="flex flex-col gap-6 md:flex-row md:gap-12">
          <div class="flex items-center gap-2">
            <Checkbox id="demo-cb" v-model="checkbox1" />
            <Label for="demo-cb">Đồng ý điều khoản ({{ checkbox1 ? 'on' : 'off' }})</Label>
          </div>
          <div class="flex items-center gap-2">
            <Switch id="demo-sw" v-model="switch1" />
            <Label for="demo-sw">Bật tự động ({{ switch1 ? 'on' : 'off' }})</Label>
          </div>
          <RadioGroup v-model="radioValue">
            <div class="flex items-center gap-2">
              <RadioGroupItem id="r1" value="default" />
              <Label for="r1">Mặc định</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="r2" value="comfortable" />
              <Label for="r2">Thoải mái</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="r3" value="compact" />
              <Label for="r3">Gọn</Label>
            </div>
          </RadioGroup>
        </div>
      </section>

      <!-- ============ SELECT ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Select</h2>
        <Select v-model="selectValue">
          <SelectTrigger class="w-[240px]">
            <SelectValue placeholder="Chọn nền tảng" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Nền tảng quảng cáo</SelectLabel>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="zalo">Zalo</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <p class="mt-2 text-sm text-muted-foreground">Đã chọn: {{ selectValue || '(chưa chọn)' }}</p>
      </section>

      <!-- ============ OVERLAYS: Dialog / Popover / Tooltip / Dropdown ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Dialog / Popover / Tooltip / Dropdown Menu</h2>
        <div class="flex flex-wrap items-center gap-3">
          <!-- Dialog -->
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="outline">Mở Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận xoá chiến dịch</DialogTitle>
                <DialogDescription>
                  Hành động này không thể hoàn tác. Chiến dịch sẽ bị xoá vĩnh viễn.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose as-child><Button variant="outline">Huỷ</Button></DialogClose>
                <DialogClose as-child><Button variant="destructive">Xoá</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <!-- Popover -->
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Mở Popover</Button>
            </PopoverTrigger>
            <PopoverContent class="w-64">
              <p class="text-sm font-medium">Bộ lọc nhanh</p>
              <p class="mt-1 text-sm text-muted-foreground">Nội dung tuỳ ý đặt trong popover.</p>
            </PopoverContent>
          </Popover>

          <!-- Tooltip -->
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline">Hover xem Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Đây là tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <!-- Dropdown Menu -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline">Mở Dropdown</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Icon name="user" :size="16" /> Hồ sơ</DropdownMenuItem>
              <DropdownMenuItem><Icon name="settings" :size="16" /> Cài đặt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem v-model:checked="dropdownChecked">
                Hiện thông báo
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <!-- ============ DRAWER ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Drawer</h2>
        <div class="flex flex-wrap items-center gap-3">
          <!-- Drawer mặc định (trượt từ dưới lên) -->
          <Drawer>
            <DrawerTrigger as-child>
              <Button variant="outline">Drawer (dưới)</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Bộ lọc chiến dịch</DrawerTitle>
                <DrawerDescription>Chọn tiêu chí để lọc danh sách.</DrawerDescription>
              </DrawerHeader>
              <div class="px-4 pb-2 text-sm text-muted-foreground">
                Nội dung tuỳ ý đặt trong drawer.
              </div>
              <DrawerFooter>
                <Button>Áp dụng</Button>
                <DrawerClose as-child><Button variant="outline">Đóng</Button></DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <!-- Drawer trượt từ phải sang -->
          <Drawer direction="right">
            <DrawerTrigger as-child>
              <Button variant="outline">Drawer (phải)</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Chi tiết chiến dịch</DrawerTitle>
                <DrawerDescription>Trượt từ cạnh phải màn hình.</DrawerDescription>
              </DrawerHeader>
              <div class="px-4 pb-2 text-sm text-muted-foreground">
                Phù hợp cho panel chi tiết / chỉnh sửa nhanh.
              </div>
              <DrawerFooter>
                <DrawerClose as-child><Button variant="outline">Đóng</Button></DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </section>

      <!-- ============ TABS ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Tabs</h2>
        <Tabs default-value="overview" class="max-w-md">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="metrics">Chỉ số</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" class="pt-3 text-sm text-muted-foreground">
            Nội dung tab Tổng quan.
          </TabsContent>
          <TabsContent value="metrics" class="pt-3 text-sm text-muted-foreground">
            Nội dung tab Chỉ số.
          </TabsContent>
          <TabsContent value="settings" class="pt-3 text-sm text-muted-foreground">
            Nội dung tab Cài đặt.
          </TabsContent>
        </Tabs>
      </section>

      <!-- ============ TABLE ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Table</h2>
        <Table>
          <TableCaption>Danh sách chiến dịch quảng cáo.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên chiến dịch</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead class="text-right">Ngân sách</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in tableRows" :key="row.id">
              <TableCell class="font-medium">{{ row.id }}</TableCell>
              <TableCell>{{ row.name }}</TableCell>
              <TableCell>
                <Badge :variant="row.status === 'Đang chạy' ? 'default' : 'secondary'">
                  {{ row.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">{{ row.budget }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <!-- ============ PAGINATION ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Pagination</h2>
        <Pagination
          v-slot="{ page }"
          v-model:page="currentPage"
          :total="100"
          :items-per-page="10"
          :sibling-count="1"
          show-edges
        >
          <PaginationContent v-slot="{ items }">
            <PaginationFirst />
            <PaginationPrevious />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :index="index" />
            </template>
            <PaginationNext />
            <PaginationLast />
          </PaginationContent>
        </Pagination>
        <p class="mt-2 text-sm text-muted-foreground">Trang hiện tại: {{ currentPage }}</p>
      </section>

      <!-- ============ AVATAR / SEPARATOR / SKELETON ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Avatar / Separator / Skeleton</h2>
        <div class="flex flex-wrap items-center gap-6">
          <Avatar>
            <AvatarImage src="https://github.com/vuejs.png" alt="Vue" />
            <AvatarFallback>VU</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="" alt="fallback" />
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <Separator orientation="vertical" class="h-10" />
          <div class="flex flex-col gap-2">
            <Skeleton class="h-4 w-48" />
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-8 w-24" />
          </div>
        </div>
        <Separator class="my-4" />
        <p class="text-sm text-muted-foreground">Separator ngang ở trên.</p>
      </section>

      <!-- ============ SONNER (toast) ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Sonner (Toast)</h2>
        <div class="flex flex-wrap gap-3">
          <Button variant="outline" @click="toast('Thông báo cơ bản')">Toast thường</Button>
          <Button variant="outline" @click="toast.success('Lưu thành công!')">Success</Button>
          <Button variant="outline" @click="toast.error('Đã có lỗi xảy ra')">Error</Button>
          <Button variant="outline" @click="toast.info('Thông tin cập nhật')">Info</Button>
          <Button variant="outline" @click="toast.warning('Cảnh báo ngân sách')">Warning</Button>
        </div>
      </section>

      <!-- ============ ICONS ============ -->
      <section>
        <h2 class="mb-3 text-xl font-semibold">Icons ({{ ICON_NAMES.length }})</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3">
          <div
            v-for="name in ICON_NAMES"
            :key="name"
            class="flex flex-col items-center gap-1 rounded-md border p-2 text-center"
          >
            <Icon :name="name" :size="20" />
            <span class="truncate text-[10px] text-muted-foreground" :title="name">{{ name }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
