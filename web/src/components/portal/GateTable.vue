<script setup lang="ts">
import { computed } from 'vue'
import type { PortalGate } from '@lgi/shared'

const props = defineProps<{ gates: PortalGate[] }>()

const HARD_ORDER = ['GATE_1', 'GATE_2', 'GATE_3', 'GATE_4', 'GATE_5', 'GATE_6', 'GATE_9']
const ADVISORY_ORDER = ['GATE_7', 'GATE_8']

const sortBy = (list: PortalGate[], order: string[]) =>
  [...list].sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

const hard = computed(() =>
  sortBy(
    props.gates.filter((gate) => gate.severity === 'hard'),
    HARD_ORDER
  )
)

const advisory = computed(() =>
  sortBy(
    props.gates.filter((gate) => gate.severity === 'advisory'),
    ADVISORY_ORDER
  )
)

const MARK: Record<string, { icon: string; cls: string; text: string }> = {
  pass: { icon: '✓', cls: 'pass', text: '满足' },
  fail: { icon: '×', cls: 'fail', text: '不满足' },
  pending: { icon: '!', cls: 'pending', text: '需确认' },
  unknown: { icon: '?', cls: 'unknown', text: '材料不足' }
}

const markOf = (gate: PortalGate) => MARK[gate.verdict] ?? MARK.unknown

const passCount = computed(() => hard.value.filter((gate) => gate.effective === 'pass').length)
</script>

<template>
  <div class="gates">
    <div class="group">
      <div class="group-head">
        <span class="group-name">硬性认定指标</span>
        <span class="group-count">满足 {{ passCount }} / {{ hard.length }}</span>
      </div>
      <p class="group-hint">官方要求同时满足，缺一不可。</p>

      <ul>
        <li v-for="gate in hard" :key="gate.id" :class="markOf(gate).cls">
          <span class="mark">{{ markOf(gate).icon }}</span>
          <div class="body">
            <span class="name">{{ gate.name }}</span>
            <span class="detail">{{ gate.explain }}</span>
            <span v-if="gate.skipped && gate.skipReason" class="skip">{{ gate.skipReason }}</span>
            <span v-if="gate.passedVia" class="via">由 {{ gate.passedVia }} 判定通过</span>
          </div>
          <span class="verdict">{{ markOf(gate).text }}</span>
        </li>
      </ul>
    </div>

    <div v-if="advisory.length > 0" class="group advisory">
      <div class="group-head">
        <span class="group-name">主观项提醒</span>
        <span class="group-count">{{ advisory.length }} 项</span>
      </div>
      <p class="group-hint">
        官方口径为企业如实说明即可，本工具按提示项处理，<b>不影响达标结论</b>。
      </p>

      <ul>
        <li v-for="gate in advisory" :key="gate.id" :class="markOf(gate).cls">
          <span class="mark">{{ markOf(gate).icon }}</span>
          <div class="body">
            <span class="name">{{ gate.name }}</span>
            <span class="detail">{{ gate.explain }}</span>
            <span v-if="gate.policyRef" class="ref">{{ gate.policyRef }}</span>
          </div>
          <span class="verdict">{{ markOf(gate).text }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.gates {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eef2f7;
}

.group-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
}

.group-count {
  font-size: 11.5px;
  color: #a3adbb;
}

.group-hint {
  margin: 8px 0 6px;
  font-size: 11.5px;
  line-height: 1.7;
  color: #a3adbb;
}

.group-hint b {
  color: #64748b;
  font-weight: 600;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 56px;
  align-items: start;
  gap: 10px;
  padding: 11px 4px;
  border-bottom: 1px dashed #f1f5f9;
}

li:last-child {
  border-bottom: none;
}

.mark {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1;
}

li.pass .mark {
  background: #ecfdf5;
  color: #059669;
}

li.fail .mark {
  background: #fef2f2;
  color: #dc2626;
}

li.pending .mark {
  background: #fffbeb;
  color: #d97706;
}

li.unknown .mark {
  background: #f1f5f9;
  color: #94a3b8;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name {
  font-size: 12.5px;
  font-weight: 500;
  color: #334155;
}

.detail {
  font-size: 11px;
  line-height: 1.65;
  color: #94a3b8;
}

.skip {
  font-size: 11px;
  color: #64748b;
}

.via {
  font-size: 10.5px;
  color: #059669;
}

.ref {
  font-size: 10.5px;
  color: #b3bccb;
}

.verdict {
  text-align: right;
  font-size: 11.5px;
  color: #94a3b8;
  white-space: nowrap;
}

li.pass .verdict {
  color: #059669;
}

li.fail .verdict {
  color: #dc2626;
}

li.pending .verdict {
  color: #d97706;
}

.advisory {
  padding: 14px 16px;
  border-radius: 12px;
  background: #fffdf5;
  border: 1px solid #fdf0d5;
}

.advisory li {
  border-bottom-color: #faf1e0;
}
</style>
