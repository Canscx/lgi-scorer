# AGENTS.md

专精特新“小巨人”申报自评打分系统。上传企业材料 → 抽取证据 → 规则引擎打分 → 输出达标诊断。
当前 `v0.1.0`：批次 0（骨架）与批次 1（规则包与门槛引擎）已完成，客户流程与报告待建。

## 技术栈（已定，勿改）

Vue3 + TypeScript + Vite + Element Plus + ECharts / Express 5 / 纯文件系统存储。
pnpm workspaces：`shared` / `server` / `web`。

## 硬性规则

- 代码零注释
- 仅适配桌面端
- 禁用 axios，统一 fetch
- 不引入 Pinia（两个 composable 足够）
- CSS 用 scoped

## 三条不可推翻的决策

1. **后端 Node，不是 Python** —— 评分引擎需前后端共享，以便前端调参实时重算。
   止损点：3 份真实材料实测 pdfjs 表格准确率 < 70%，才换 Python。
2. **前端 Vue3，不是 React** —— 页面 90% 是表格与表单，Element Plus 主场。
3. **门槛与分数分离** —— 门槛不过分数再高也不通过；提示项不影响结论。

## 与参考项目（专精特新站）的核心差异

| 项 | 专精特新站 | 本项目 |
|---|---|---|
| 合格线 | 50 | **60** |
| 门槛 | 6 道 | **9 道**（7 硬 + 2 提示项） |
| 前置资质 | 科技和创新型中小企业 | **专精特新中小企业** |
| 营收 | ≥1500 万 或 股权融资 ≥2000 万 | **≥5000 万**（无替代路径） |
| 主营占比 | ≥80% | **≥90%** |
| 资产负债率 | ≤80% | **≤75%** |
| 复合增长率 | 无 | **≥5%**（复核豁免） |
| 研发 | 每年 ≥100 万 | **近两年合计 ≥1200 万** |
| 知识产权 | ≥1 项 Ⅰ类 | **≥4 项 Ⅰ类**（不含转入） |
| 奖励豁免 | 省部级以上 | **仅国家级** |
| 端口 | 8787 | **8788** |

## 政策依据

- 《优质中小企业梯度培育管理办法》工信部企业〔2026〕2号，2026-04-01 施行
  附件 2 是小巨人认定标准，七项指标必须同时满足
- 《中小企业专精特新发展评价指标体系（企业）（试行）》工信厅企业〔2024〕75号
  **注意：该文附件表与各维度权重均未公开上网**，规则包中的 15/20/15/35/15 为二手来源

## 纪律

- 动手前读 `docs/PLAN.md` 的第一节（政策核查结论）与第十一节（实施进度）
- 改规则参数只改 `config/rules/`，不改代码
- 新增或修改门槛后必须跑 `pnpm validate`
- 完成任务后追加 `docs/PLAN.md` 第十一节

## 索引

`docs/PLAN.md` 方案文档与实施进度 · `docs/architecture.md` 架构与接口 · `docs/scoring.md` 打分数学 · `docs/pipeline.md` 解析与 AI 契约

`config/rules/rules.lgi.v1.0.0.json` 9 道门槛 + 23 项指标 + 10 条假设
`config/catalog/field-catalog.v1.json` 52 字段
`config/benchmarks/` 行业基准（与小巨人等级无关，直接复用）

`shared/src/scoring/gates.ts` 门槛求值：severity / enabled / reviewExempt 三种开关都在这里
`shared/src/scoring/engine.ts` 引擎入口，纯函数零 I/O
`shared/schema/` 5 个 JSON Schema

`server/src/portal/` 客户轻流程编排 · `server/src/report/` 报告渲染 · `server/src/pipeline/` 解析链路
`web/src/views/portal/` 客户侧页面 · `web/src/views/` 管理端页面

`deploy/` 宝塔部署手册 + nginx/PM2 配置 + update/backup/rollback 脚本
