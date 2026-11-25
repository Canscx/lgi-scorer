# 变更日志

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

> 说明：仓库暂未打 git tag，下面的版本号与日期取自 `package.json` 的 `version` 与 `git log` 的提交记录；条目均来自真实提交与 `docs/PLAN.md` 第十一节的实施记录。

## [未发布]

### 变更

- **品牌标识换新**：图标从「七根细柱 + 基准线」改为「三根圆角柱 + superellipse 底」——柱高按 0.36 / 0.68 / 1 递进，柱体白→`#E9F1FF` 纵向渐变、透明度 0.72 / 0.88 / 1 分档，底色 `#5B9BFD → #2F6BF0 → #12308F` 对角渐变 + 左上径向高光 + 0.7px 内描边。`BrandMark.vue` 的 `radius` prop 移除，圆角由 superellipse 路径本身决定；投影改由组件内 `drop-shadow` 承担，三处调用点的 `.mark` 不再重复写 `border-radius` 与 `box-shadow`。`web/public/favicon.svg` 与 `assets/logo.svg` 同步替换。

## [0.2.0] - 2026-11-16

### 新增

- **部署更新脚本增加自动回滚与数据备份**：`bash deploy/update.sh` 一条命令完成同步，失败自动回滚；新增代码快照与 `data/` 数据快照两类备份，分别由 `deploy/backup.sh` / `deploy/rollback.sh` 管理。
- **品牌标识统一为七段柱状上升图形**（七根柱对应七项认定指标，基准线取「参考线」之意）：新建 `web/src/components/BrandMark.vue`，登录页 46px、管理后台 44px、客户页 38px；新增 `web/public/favicon.svg`。

### 变更

- **「七项认定指标」区块下移并默认折叠**：客户结果页与管理端共用的 `ScoreReport.vue` 中，该卡片从分数卡下方移到「补足建议」之后，包进原生 `<details>`，默认折叠，折叠态常显申报类型徽章与「硬性 N / 7 满足」。
- **PDF 报告由 5 页调整为 4 页**：`renderGates()` 从「独占一页」改为段内渲染器，七项认定指标并入「材料完整度」之后的区块，页眉编号改为「一、五个维度 / 二、补足建议 / 三、材料清单与说明」连贯。
- **品牌名统一到「小巨人」口径**：页面标题、后台与客户页顶栏、PDF 报告 Author 统一；README 改写为仓库门面。

### 修复

- **PDF 三态标记改用矢量路径绘制**（新增 `server/src/report/marks.ts`）：原先写入的 `√`（U+221A 正式名称是 SQUARE ROOT）字形由字体决定，在部分中文字体下会渲染成根号；现改为用 pdfkit 路径 API 手绘「通过 / 缺失 / 差距」三态，彻底不依赖字体。
- **nginx 配置适配宝塔 Node 项目的新标记**：只替换 `location /` 一段，不再整段覆盖，避免冲掉宝塔自己生成的配置。
- **自动回滚改走 `git reset`**：补齐服务器无 rsync 时的降级路径与脚本函数定义顺序问题。

## [0.1.0] - 2026-11-12

首个可运行版本，7 个批次全部完成（详见 `docs/PLAN.md` 第十一节）。

### 新增

- **批次 0 · 骨架与品牌**：从参考项目拷贝骨架并改造为小巨人站——包名 `@srdi/*` → `@lgi/*`，端口 8787 → **8788**，dev 5180 → **5181**，cookie 改 `lgi_client` / `lgi_session`。
- **批次 1 · 规则包与门槛引擎**：新建 `config/rules/rules.lgi.v1.0.0.json`（`level=LITTLE_GIANT`、`passLine=60`、**9 道门槛** = 7 硬 + 2 提示项、5 维度 23 项指标、10 条假设）；门槛引擎支持 `enabled` / `severity: advisory` / `reviewExempt` 三种开关，`aggregateConclusion` 只看硬门槛；字段目录升到 2.0.0（52 字段）。
- **批次 2 · 材料槽位与申报类型**：材料槽位从 5 个扩到 **8 个**（新增专精特新中小企业证书、市场占有率说明、产业链关键环节说明），新增申报类型（新申请 / 到期复核）与客户自述字段。
- **批次 3 · 结果页门槛区块**：新增 `PortalGate` / `PortalGateSummary` 契约与 `buildGateSummary()`，新建 `GateTable.vue`（7 道硬门槛与 2 道提示项分组展示，四态颜色，复核类型显示口径提示条）。
- **批次 4 · PDF 报告**：新增 `renderGates()`，报告新增七项认定指标页，材料清单扩到 8 槽，封面标题改为小巨人口径。
- **批次 5 · 差异对照页**：新建 `shared/src/compare.ts` 与 `web/src/views/CompareView.vue`（路由 `#/compare`），八大关键差异常显，三节完整对照默认折叠。
- **批次 6 · 部署文档**：`deploy/宝塔部署教程.md` 与 `deploy/README.md` 重写，补充与专精特新站共存的检查清单；`docs/scoring.md` 重写前三节。

### 修复

- **GATE_1 永远判「材料不足」**：门槛判据依赖客户自述（专精特新中小企业称号、细分市场年限、国家级科技奖励），但前端没有入口；现改为客户直接回答并写进证据，四种组合场景验证通过。
- **小巨人专属槽位纳入缺失检测**：必传的专精特新中小企业证书缺失时能被明确提示。

### 文档

- `docs/PLAN.md` 补充批次 4–6 与真实材料验收结果；`PROGRESS.md` 更新到 7 个批次全部完成。
- **真实材料端到端验收**：11 份真实材料 / 44 页，上传 213 ms，解析 0 失败，AI 抽取 81 条候选、确认 13 项，结论 `status=ready`，PDF 生成正常。
- **测试规模**：shared **162** 项 + server **158** 项，全部通过，`pnpm validate` 三闸全绿。
