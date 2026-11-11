<script setup lang="ts">
import { COMPARE_HIGHLIGHTS, COMPARE_SECTIONS } from '@lgi/shared'
import { goto } from '@/router'
</script>

<template>
  <div class="compare">
    <header class="hero">
      <button class="back" type="button" @click="goto('/')">← 返回自评</button>
      <h1>专精特新中小企业 vs 专精特新“小巨人”</h1>
      <p>
        两个等级共用同一套评价指标体系，仅合格分数线不同（50 分 vs 60 分），
        但硬性准入门槛有 12 处实质差异。以下是官方原文口径的逐条对照。
      </p>
    </header>

    <section class="card">
      <h2>八大关键差异</h2>
      <p class="sub">先看这八条，其余是细节。</p>
      <div class="highlight-table">
        <div class="hrow hhead">
          <span>对比维度</span>
          <span>专精特新中小企业</span>
          <span>专精特新“小巨人”</span>
        </div>
        <div v-for="row in COMPARE_HIGHLIGHTS" :key="row.dimension" class="hrow">
          <span class="dim">{{ row.dimension }}</span>
          <span class="srdi">{{ row.srdi }}</span>
          <span class="lgi">{{ row.littleGiant }}</span>
        </div>
      </div>
    </section>

    <section v-for="section in COMPARE_SECTIONS" :key="section.id" class="card">
      <details class="fold">
        <summary>
          <span class="fold-title">{{ section.title }}</span>
          <span class="fold-meta">{{ section.rows.length }} 条</span>
          <span class="fold-toggle" />
        </summary>
        <p class="intro">{{ section.intro }}</p>
        <div class="rows">
          <div v-for="row in section.rows" :key="row.dimension" class="row">
            <div class="row-dim">{{ row.dimension }}</div>
            <div class="row-cols">
              <div class="col srdi">
                <span class="tag">专精特新中小企业</span>
                <p>{{ row.srdi }}</p>
              </div>
              <div class="col lgi">
                <span class="tag">小巨人</span>
                <p>{{ row.littleGiant }}</p>
              </div>
            </div>
            <p v-if="row.note" class="note">{{ row.note }}</p>
          </div>
        </div>
      </details>
    </section>

    <footer class="foot">
      <p>
        政策依据：《优质中小企业梯度培育管理办法》（工信部企业〔2026〕2号，2026-04-01 施行）附件 1 与附件 2；
        《中小企业专精特新发展评价指标体系（试行）》（工信厅企业〔2024〕75号）。
      </p>
      <p>
        评价体系的一级维度权重官方未公开上网，本站的自评报告按二手来源估算，仅作自查参考。
      </p>
    </footer>
  </div>
</template>

<style scoped>
.compare {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero {
  padding: 22px 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%);
  border: 1px solid #e2ecfa;
}

.back {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;
}

.back:hover {
  color: #2563eb;
}

.hero h1 {
  margin: 0;
  font-size: 21px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: 0.3px;
}

.hero p {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: #64748b;
}

.card {
  padding: 20px 22px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef6;
}

.card h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.sub {
  margin: 6px 0 16px;
  font-size: 11.5px;
  color: #a3adbb;
}

.highlight-table {
  display: flex;
  flex-direction: column;
}

.hrow {
  display: grid;
  grid-template-columns: 150px 1fr 1fr;
  gap: 14px;
  padding: 10px 8px;
  border-bottom: 1px dashed #f1f5f9;
  font-size: 12px;
  align-items: baseline;
}

.hrow:last-child {
  border-bottom: none;
}

.hrow.hhead {
  background: #f8fafc;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
}

.dim {
  color: #334155;
  font-weight: 500;
}

.srdi {
  color: #64748b;
}

.lgi {
  color: #2563eb;
  font-weight: 500;
}

.fold > summary {
  display: flex;
  align-items: baseline;
  gap: 10px;
  cursor: pointer;
  list-style: none;
}

.fold > summary::-webkit-details-marker {
  display: none;
}

.fold-title {
  font-size: 14.5px;
  font-weight: 600;
  color: #111827;
}

.fold-meta {
  font-size: 11.5px;
  color: #a3adbb;
}

.fold-toggle {
  margin-left: auto;
  font-size: 11.5px;
  color: #2563eb;
}

.fold-toggle::after {
  content: '展开';
}

.fold[open] .fold-toggle::after {
  content: '收起';
}

.fold[open] > summary {
  margin-bottom: 14px;
}

.intro {
  margin: 0 0 16px;
  padding: 10px 13px;
  border-radius: 9px;
  background: #f8fafc;
  font-size: 11.5px;
  line-height: 1.8;
  color: #64748b;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.row {
  padding-bottom: 14px;
  border-bottom: 1px dashed #f1f5f9;
}

.row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.row-dim {
  font-size: 12.5px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.row-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.col {
  padding: 11px 13px;
  border-radius: 10px;
  background: #fafbfd;
}

.col.lgi {
  background: #f6f9fe;
}

.col .tag {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 500;
  margin-bottom: 6px;
  background: #eef2f7;
  color: #64748b;
}

.col.lgi .tag {
  background: #e0ecff;
  color: #2563eb;
}

.col p {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: #475569;
}

.note {
  margin: 8px 0 0;
  padding-left: 10px;
  border-left: 2px solid #dbeafe;
  font-size: 11px;
  line-height: 1.7;
  color: #94a3b8;
}

.foot {
  padding: 16px 20px;
  border-radius: 12px;
  background: #fafbfd;
  font-size: 11px;
  line-height: 1.9;
  color: #a3adbb;
}

.foot p {
  margin: 0;
}

.foot p + p {
  margin-top: 6px;
}
</style>
