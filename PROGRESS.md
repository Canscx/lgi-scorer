# 开发进度

> 只写未完成项。完成项折叠成一行。不写每日日志。

## 接续点（新对话从这里开始）

**已完成全部 7 个批次**：骨架改造 → 规则包与门槛引擎 → 8 个材料槽位 → 结果页门槛区块 → PDF 报告门槛页 → 差异对照页 → 部署文档。真实材料（11 份 / 44 页）端到端验收通过。
**未开工**：无。剩下的是「可选的增强项」，见下方待办。

**下一步建议**（按优先级）：

1. 在真实服务器上跑一遍宝塔部署，验证 8788 端口与 lgi 前缀脚本
2. 找 2-3 家真实企业试填，看材料上传与门槛判定的实际命中率
3. 复核口径的「上一年度得分」目前只进证据不参与 GATE_9 判定，需要补上双年判定
4. `pnpm pack:portable` 已改名为 lgi，未实测

**三条命令**

- `pnpm validate`：配置校验 + 三包类型 + 全部测试，提交前必跑
- `pnpm start`：构建前端并起服务，**8788**
- `pnpm dev`：server 8788 + vite 5181

**三条最容易重踩的坑**

1. jsep 对 `count(x where ...)` **不报错**，会把 where 当第二个实参；`parser.ts` 已注册运算符并做 AST 校验，不要绕过它直接调 jsep。
2. vitest 的模块缓存在多 worker 下并发写同一临时文件，Windows 上偶发 EPERM；已设 `fileParallelism: false`。
3. 参考项目占 8787/5180，本项目固定 **8788/5181**。

**不可动摇的契约**：证据只认 `confirmed`；确认层是唯一写 `value` 的地方；打分只读 confirmed 与 ScoreResult；引擎是零 I/O 纯函数。

## 当前状态

`v0.1.0` · 7 个批次全部完成 · 最后更新 2026-11-12

## 已完成

**批次 0 · 骨架与品牌**

- 从参考项目拷贝骨架（排除 .git/node_modules/data/release/.tmp/web-dist/.workbuddy）
- 包名 `@srdi/*` → `@lgi/*`，`srdi-scorer` → `lgi-scorer`；端口 8787 → **8788**，dev 5180 → **5181**；cookie `lgi_client` / `lgi_session`；localStorage `lgi.login.v1`

**批次 1 · 规则包与门槛引擎**

- `config/rules/rules.lgi.v1.0.0.json`：level=LITTLE_GIANT，passLine=60，**9 道门槛**（7 硬 + 2 提示项，GATE_4 复核豁免），5 维度 23 指标，10 条假设
- 引擎支持 `enabled` / `severity: advisory` / `reviewExempt` 三种门槛开关；`aggregateConclusion` 只看硬门槛
- 字段目录 1.1.0 → 2.0.0，47 → **52 字段**（改名 scitechSmeTitle→srdiTitle、scienceAward→nationalScienceAward）
- IND_17 档位重排为小巨人 **4 项红线**（≥4 高价值 10 / ≥4 自主研发 8 / ≥4 三项 7 / 1-3 项 3 / 仅Ⅱ类 1 / 无 0）
- 三家样本 golden 重算：firm-a 84.81 pass / firm-b 57.45 pending / firm-c 28.29 fail

**批次 2 · 材料槽位与申报类型**

- `config/portal.json` 2.0.0：**8 个槽位**（新增 srdiCert 必传 / marketShare / chainKey），加 applicationTypes 与 gateHints
- 客户自述扩展：市占率、六基归属、产业链关键环节、申报类型
- `ProjectLevel` 收敛为 `'LITTLE_GIANT'`，删除等级拒绝分支

**批次 3 · 结果页门槛区块**

- 新增 `PortalGate` / `PortalGateSummary` 契约与 `buildGateSummary()`
- 新建 `GateTable.vue`：7 硬门槛 + 2 提示项分两组，四态颜色，复核类型显示口径提示条

**批次 4 · PDF 报告**

- 新增 `renderGates()`，报告 3 页 → **5 页**（第 2 页是七项认定指标）
- 封面标题改小巨人口径；材料清单扩到 8 槽

**批次 5 · 差异对照页**

- `shared/src/compare.ts` + `CompareView.vue`，路由 `#/compare`
- 八大关键差异常显，三节完整对照（4 + 12 + 6 条）默认折叠

**批次 6 · 部署文档**

- `deploy/宝塔部署教程.md` 与 `deploy/README.md` 重写，新增与专精特新站共存的检查清单
- `docs/scoring.md` 重写前三节

**验收 · 真实材料端到端（2026-11-12）**

- 11 份真实材料 / **44 页** / 上传 213ms / 解析 0 失败 / AI 抽取 **81 条候选** / 确认 13 项
- `status=ready`，official 36.83，门槛 6 fail + 1 pending，PDF 5 页生成正常
- **修掉一个真实缺口**：GATE_1 依赖客户自述但前端无入口，已补上称号勾选 / 年限输入 / 国家级奖励勾选

**测试规模**：shared **162** 项 + server **154** 项，全部通过；`pnpm validate` 三闸全绿。

## 待办（可选增强，非阻塞）

- [ ] 宝塔真机部署验收（8788 端口 + lgi 前缀脚本）
- [ ] 复核口径「上一年度得分」参与 GATE_9 双年判定
- [ ] `pnpm pack:portable` 便携包实测
- [ ] `samples/` 里的虚构材料仍是专精特新口径，未按小巨人重生成

## 已知坑

- `pdfjs` 在 Node 下渲染必须有 canvas 实现，用 `@napi-rs/canvas`，不是 `canvas`
- 环境变量禁用 `VITE_` 前缀，否则会被打进前端 bundle 等同公开密钥
- 混合型 PDF（文字页与扫描页混排）必须页级判定，不能文件级一刀切
- `ratio` 类字段一律用小数（0.52 表示 52%）；模型回百分数时必须按 0.01 折算
- 门槛的 `anyOf` 下，某条检查返回 null（有数据但条件不成立）会判 pending 而非 fail，这是刻意设计，测试断言用 `not.toBe('pass')`
- 改 `config/rules/` 后已出过分的项目不会自动重算（项目创建时绑定规则版本），这是刻意设计
- **评估接口要求项目至少有 1 份材料**（`no_files` 400），纯填表不传材料无法评估
- **admin 账号不能调客户接口**（403 forbidden），跨角色验证要开两个会话
- PDF 的四态符号用 `√ ○ × ?` 而非 emoji（中文字体没有 emoji 字形）
- 中文字体里没有 `✓(U+2713)` / `✗(U+2717)`，但都有 `√(U+221A)` / `○(U+25CB)` / `×(U+00D7)`
