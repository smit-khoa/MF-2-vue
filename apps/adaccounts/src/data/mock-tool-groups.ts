import type { ToolGroup } from '../types/ad-account';

// Static config driving the tool panel grid (group -> functions). Edit freely;
// the panel renders whatever is here via v-for. All icons must exist in
// shared-ui ICON_NAMES.
export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'budget',
    label: 'Ngân sách',
    icon: 'credit-card',
    functions: [
      { id: 'budget-increase', label: 'Tăng ngân sách', icon: 'trending-up' },
      { id: 'budget-decrease', label: 'Giảm ngân sách', icon: 'trending-down' },
      { id: 'budget-set', label: 'Đặt ngân sách', icon: 'edit' },
    ],
  },
  {
    id: 'status',
    label: 'Trạng thái',
    icon: 'bolt',
    functions: [
      { id: 'status-on', label: 'Bật', icon: 'play' },
      { id: 'status-off', label: 'Tắt', icon: 'square' },
      { id: 'status-pause', label: 'Tạm dừng', icon: 'pause' },
    ],
  },
  {
    id: 'info',
    label: 'Thông tin',
    icon: 'file-text',
    functions: [
      { id: 'info-rename', label: 'Đổi tên', icon: 'pencil' },
      { id: 'info-tag', label: 'Gán nhãn', icon: 'tag' },
    ],
  },
  {
    id: 'share',
    label: 'Chia sẻ',
    icon: 'share-2',
    functions: [
      { id: 'share-add-user', label: 'Thêm người dùng', icon: 'user' },
      { id: 'share-remove-user', label: 'Gỡ người dùng', icon: 'unlink' },
    ],
  },
];
