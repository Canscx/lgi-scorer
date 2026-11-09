# 开发进度

> 只写未完成项。完成项折叠成一行。不写每日日志。

## 接续点（新对话从这里开始）

**已完成** 批次 0 骨架（拷贝参考项目、包名 srdi→lgi、端口 8787→8788、cookie 改名）→ 批次 1 规则包与门槛引擎（rules.lgi.v1.0.0、9 道门槛、52 字段、IND_17 档位重排、三家 golden 重算）。
**未开工** 批次 2 材料槽位 8 个、批次 3 结果页、批次 4 PDF、批次 5 内容页、批次 6 部署。

**下一步**：批次 2 —— 把 config/portal.json 的 5 个槽位扩到 8 个，加 applicationType 与客户自述三字段。

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

`v0.1.0` · 批次 0-1 完成 · 最后更新 2026-11-09

## 已完成

- [x] 批次 0：从参考项目拷贝骨架（排除 .git/node_modules/data/release/.tmp/web-dist），包名 `@srdi/*` → `@lgi/*`，端口 8788/5181，cookie `lgi_client` / `lgi_session`，基线 154 项测试全绿
- [x] 批次 1 规则包：新建 `config/rules/rules.lgi.v1.0.0.json`，level=LITTLE_GIANT，passLine=60，9 道门槛（7 硬 + 2 提示项，GATE_4 复核豁免），5 维度 23 指标，10 条假设（A1–A10）
- [x] 批次 1 引擎：GateSeverity / GateMeta 类型；gates.ts 支持 enabled=false 跳过、severity=advisory 不进结论、reviewExempt 复核豁免；aggregateConclusion 只看硬门槛；engine.ts 透传 applicationType 与 disabledGates
- [x] 批次 1 Schema：rules.schema.json 门槛 ID 放到 GATE_1..GATE_12 并加 enabled/severity/reviewExempt/policyRef；score-result.schema.json 同步放行新字段
- [x] 批次 1 字段目录：1.1.0 → 2.0.0，47 → 52 字段。改名 scitechSmeTitle→srdiTitle、scienceAward→nationalScienceAward；新增 applicationType / revenueCagr / marketShare / chainSixBase / chainKeySegment
- [x] 批次 1 指标：IND_17 档位重排为小巨人 4 项红线（≥4 高价值 10 / ≥4 自主研发 8 / ≥4 三项 7 / 1-3 项 3 / 仅Ⅱ类 1 / 无 0）
- [x] 批次 1 校验器：validate-config 改为校验单 scoreGate、level=LITTLE_GIANT、硬门槛≥5、提示项≥2、指标 23、权重合计 100
- [x] 批次 1 三家样本重算：firm-a 84.81 pass / firm-b 57.45 pending / firm-c 28.29 fail
- [x] 批次 1 测试：shared 162 项、server 154 项全绿，`pnpm validate` 通过

## 待办（按批次）

- [x] 批次 0 骨架与品牌
- [x] 批次 1 规则包与门槛引擎
- [ ] 批次 2 材料槽位 8 个 + 申报类型 + 客户自述三字段
- [ ] 批次 3 结果页 9 道门槛 + 提示项区 + 复核提示
- [ ] 批次 4 PDF 报告重排（4 页，白底）
- [ ] 批次 5 内容页（专精特新 vs 小巨人差异对照，默认折叠）
- [ ] 批次 6 部署文档与宝塔脚本（lgi 前缀、8788 端口）

## 已知坑

- `pdfjs` 在 Node 下渲染必须有 canvas 实现，用 `@napi-rs/canvas`，不是 `canvas`
- 环境变量禁用 `VITE_` 前缀，否则会被打进前端 bundle 等同公开密钥
- 模型名用 `deepseek-flash`
- 混合型 PDF（文字页与扫描页混排）必须页级判定，不能文件级一刀切
- `ratio` 类字段一律用小数（0.52 表示 52%）。模型回 `unit: "%"` 或 `value: "52.3%"` 时必须按 0.01 折算并打 `unit_scaled`；折算后 `|v| > 5` 直接丢弃
- 门槛的 `anyOf` 逻辑下，若某条检查的表达式返回 null（有数据但条件不成立）会判 pending 而非 fail，这是刻意设计，测试断言要用 `not.toBe('pass')`
- 改 `config/rules/` 后已出过分的项目不会自动重算（项目创建时绑定规则版本），这是刻意设计
