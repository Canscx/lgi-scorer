<script setup lang="ts">
import { goto } from '@/router'
import BrandMark from '@/components/BrandMark.vue'
import BeianLink from '@/components/BeianLink.vue'

const emit = defineEmits<{ 'sign-out': [] }>()

const signOut = () => emit('sign-out')
</script>

<template>
  <div class="shell">
    <header class="bar">
      <div class="brand" @click="goto('/')">
        <span class="mark"><BrandMark :size="38" /></span>
        <div>
          <h1>小巨人自评</h1>
          <p>上传材料 · 自动打分 · 出具补足建议</p>
        </div>
      </div>
      <button class="exit" type="button" @click="signOut">
        退出登录
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
          <path d="M15 16l4-4-4-4" />
          <path d="M19 12H9" />
        </svg>
      </button>
    </header>

    <main class="body">
      <slot />
    </main>

    <footer class="foot">
      <span>参考得分非官方口径，仅供申报前自查 · 材料仅用于本次评估</span>
      <BeianLink />
    </footer>
  </div>
</template>

<style scoped>
.shell {
  width: 100%;
  max-width: 1080px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 18px 26px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.mark {
  display: grid;
  place-items: center;
}

h1 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: 0.3px;
}

.brand p {
  margin-top: 2px;
  font-size: 11.5px;
  color: #94a3b8;
}

.exit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid #f6dcdc;
  border-radius: 999px;
  background: #fff;
  color: #dc2626;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.exit svg {
  width: 13px;
  height: 13px;
  transition: transform 0.16s ease;
}

.exit:hover {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  box-shadow: 0 6px 14px -12px rgba(220, 38, 38, 0.9);
}

.exit:hover svg {
  transform: translateX(2px);
}

.exit:active {
  background: #fee2e2;
}

.exit:focus-visible {
  outline: 2px solid rgba(220, 38, 38, 0.3);
  outline-offset: 3px;
}

.body {
  flex: 1;
}

.foot {
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #6b7280;
  letter-spacing: 0.2px;
}
</style>
