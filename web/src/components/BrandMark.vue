<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{ size?: number; radius?: number }>(), {
  size: 38,
  radius: 11
})

const gradientId = useId()

const BARS = [
  { h: 5.5 },
  { h: 7.7 },
  { h: 9.9 },
  { h: 12.1 },
  { h: 14.3 },
  { h: 16.5 },
  { h: 18.7 }
]

const BAR_WIDTH = 2.5
const BAR_GAP = 1.3
const START_X = 3.6
const BASELINE = 25

const bars = BARS.map((bar, index) => ({
  x: START_X + index * (BAR_WIDTH + BAR_GAP),
  y: BASELINE - bar.h,
  height: bar.h
}))

const rulerWidth = BARS.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradientId" x1="4" y1="2" x2="28" y2="31" gradientUnits="userSpaceOnUse">
        <stop stop-color="#3b82f6" />
        <stop offset="0.55" stop-color="#2563eb" />
        <stop offset="1" stop-color="#0ea5e9" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" :rx="(radius / size) * 32" :fill="'url(#' + gradientId + ')'" />
    <rect
      v-for="(bar, index) in bars"
      :key="index"
      :x="bar.x"
      :y="bar.y"
      :width="BAR_WIDTH"
      :height="bar.height"
      rx="1.25"
      fill="#fff"
    />
    <rect
      :x="START_X"
      :y="BASELINE + 1.5"
      :width="rulerWidth"
      height="1.5"
      rx="0.75"
      fill="#fff"
      opacity="0.5"
    />
  </svg>
</template>
