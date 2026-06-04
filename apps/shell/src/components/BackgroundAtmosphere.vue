<script setup lang="ts">
/**
 * Atmospheric background layer dùng chung cho dark layout.
 * Radial tint + grid + stars + floating blobs. Fixed full-viewport, pointer-events none.
 */
const stars = Array.from({ length: 50 }, (_, i) => {
  const big = Math.random() > 0.75;
  return {
    key: i,
    size: big ? 2 : 1,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    opacity: 0.1 + Math.random() * 0.3,
    animation: `atm-twinkle ${3 + Math.random() * 5}s ease-in-out infinite ${Math.random() * 6}s`,
  };
});
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a1628]">
    <!-- Deep radial tints -->
    <div
      class="absolute inset-0"
      :style="{
        background:
          'radial-gradient(ellipse at 30% 70%, rgba(15,61,46,0.45) 0%, transparent 55%), radial-gradient(ellipse at 78% 15%, rgba(34,197,94,0.05) 0%, transparent 55%), radial-gradient(ellipse at 50% 95%, rgba(20,184,166,0.05) 0%, transparent 60%)',
      }"
    />

    <!-- Grid overlay -->
    <svg class="absolute inset-0 h-full w-full opacity-[0.035]">
      <defs>
        <pattern id="atm-grid" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M 44 0 L 0 0 0 44" fill="none" stroke="white" stroke-width="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#atm-grid)" />
    </svg>

    <!-- Stars -->
    <div class="absolute inset-0">
      <div
        v-for="s in stars"
        :key="s.key"
        class="absolute rounded-full bg-white"
        :style="{
          width: `${s.size}px`,
          height: `${s.size}px`,
          top: s.top,
          left: s.left,
          opacity: s.opacity,
          animation: s.animation,
        }"
      />
    </div>

    <!-- Blobs -->
    <div
      class="absolute rounded-full opacity-[0.12] blur-[110px]"
      :style="{
        width: '720px',
        height: '720px',
        top: '-18%',
        right: '-12%',
        background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)',
        animation: 'atm-blob 20s ease-in-out infinite',
      }"
    />
    <div
      class="absolute rounded-full opacity-[0.08] blur-[130px]"
      :style="{
        width: '640px',
        height: '640px',
        bottom: '-12%',
        left: '-12%',
        background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)',
        animation: 'atm-blob 26s ease-in-out infinite reverse',
      }"
    />
    <div
      class="absolute rounded-full opacity-[0.05] blur-[90px]"
      :style="{
        width: '440px',
        height: '440px',
        top: '55%',
        left: '45%',
        background: 'radial-gradient(circle, #bef264 0%, transparent 70%)',
        animation: 'atm-blob 17s ease-in-out infinite 2s',
      }"
    />
  </div>
</template>
