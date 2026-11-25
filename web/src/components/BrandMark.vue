<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{ size?: number }>(), {
  size: 38
})

const uid = useId()

const squash = (value: number, exponent: number) =>
  Math.sign(value) * Math.pow(Math.abs(value), 2 / exponent)

const buildSquircle = () => {
  const steps = 44
  const power = 4.6
  const points: [number, number][] = []
  for (let i = 0; i < steps; i += 1) {
    const angle = (2 * Math.PI * i) / steps - Math.PI / 2
    points.push([16 + 16 * squash(Math.cos(angle), power), 16 + 16 * squash(Math.sin(angle), power)])
  }
  const round = (n: number) => n.toFixed(2)
  let path = `M ${round(points[0][0])} ${round(points[0][1])}`
  for (let i = 0; i < steps; i += 1) {
    const prev = points[(i - 1 + steps) % steps]
    const start = points[i]
    const end = points[(i + 1) % steps]
    const after = points[(i + 2) % steps]
    const c1x = start[0] + (end[0] - prev[0]) / 6
    const c1y = start[1] + (end[1] - prev[1]) / 6
    const c2x = end[0] - (after[0] - start[0]) / 6
    const c2y = end[1] - (after[1] - start[1]) / 6
    path += ` C ${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(end[0])} ${round(end[1])}`
  }
  return `${path} Z`
}

const squircle = buildSquircle()

const BARS = [
  { x: 5.3, y: 17.5, height: 8.4, opacity: 0.72 },
  { x: 13.25, y: 11.3, height: 14.6, opacity: 0.88 },
  { x: 21.2, y: 5.1, height: 20.8, opacity: 1 }
]

const BAR_WIDTH = 5.5
const BAR_RADIUS = 2.75
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
      <linearGradient :id="`${uid}b`" x1="3" y1="0" x2="29" y2="32" gradientUnits="userSpaceOnUse">
        <stop stop-color="#5B9BFD" />
        <stop offset="0.44" stop-color="#2F6BF0" />
        <stop offset="1" stop-color="#12308F" />
      </linearGradient>
      <radialGradient :id="`${uid}h`" cx="0.22" cy="0.04" r="0.95">
        <stop stop-color="#FFFFFF" stop-opacity="0.3" />
        <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.07" />
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="`${uid}g`" x1="16" y1="5" x2="16" y2="26" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFFFFF" />
        <stop offset="1" stop-color="#E9F1FF" />
      </linearGradient>
    </defs>
    <path :d="squircle" :fill="`url(#${uid}b)`" />
    <path :d="squircle" :fill="`url(#${uid}h)`" />
    <rect
      v-for="(bar, index) in BARS"
      :key="index"
      :x="bar.x"
      :y="bar.y"
      :width="BAR_WIDTH"
      :height="bar.height"
      :rx="BAR_RADIUS"
      :fill="`url(#${uid}g)`"
      :opacity="bar.opacity"
    />
    <path :d="squircle" fill="none" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="0.7" />
  </svg>
</template>

<style scoped>
svg {
  display: block;
  filter: drop-shadow(0 4px 9px rgba(18, 48, 143, 0.26));
}
</style>
