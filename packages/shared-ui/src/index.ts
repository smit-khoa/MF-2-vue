// Core remote/loading components
export { default as RemoteErrorBoundary } from "./components/RemoteErrorBoundary.vue";
export { default as RemoteLoadingFallback } from "./components/RemoteLoadingFallback.vue";
export { default as SmitLogo } from "./components/SmitLogo.vue";
export { default as SmitLoading } from "./components/SmitLoading.vue";

// shadcn-vue primitives (reka-ui based)
export { default as Button } from "./components/ui/Button.vue";
export { default as Card } from "./components/ui/Card.vue";

// Utilities
export { cn } from "./lib/utils";
export { colors } from "./lib/colors";
export type { ColorToken } from "./lib/colors";

// Icons + sprite provider
export { SpriteProvider, useSpriteReady, Icon, ICON_NAMES } from "./icons";
export type { IconName } from "./icons";
