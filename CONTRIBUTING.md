# 贡献指南

感谢你关注「专精特新·小巨人申报自评打分系统」（`lgi-scorer`）。这份文档说明本地怎么跑起来、改哪里、怎么提 PR。

> 本项目输出为**自查参考**，非官方评分。最终认定以培育平台计算与主管部门审核结果为准。

---

## 一、环境要求

| 工具 | 版本要求 | 说明 |
|---|---|---|
| Node.js | **>= 20.11** | `package.json` 的 `engines.node` 硬性约束 |
| pnpm | **9 及以上**（锁文件 `lockfileVersion: 9.0`） | 本仓库是 pnpm workspaces，不用 npm / yarn |

三包 workspace：`shared` / `server` / `web`，根目录 `pnpm-workspace.yaml` 已声明。

`server` 依赖 `@napi-rs/canvas`（pdfjs 在 Node 下渲染必须有 canvas 实现，**不是 `canvas`**）与 `pdfkit` / `pdfjs-dist`；`web` 用 Vue 3 + Element Plus + ECharts，全部是 npm registry 上的公开包。

## 二、拉起项目

```bash
pnpm install          # 安装 workspace 全部依赖
pnpm dev              # 开发模式：server 8788 + vite 5181
pnpm start            # 构建前端并启动：http://localhost:8788
```

首次运行需要模型接口：启动后点右上角「模型设置」填 API 地址与 Key，保存即生效，不用重启；也可以用环境变量兜底（页面配置优先级更高）：

```bash
cp .env.example .env
# 编辑 .env，填 AI_API_KEY
```

> 环境变量**不要用 `VITE_` 前缀**，否则会被打进前端 bundle，等同公开密钥。

常用命令：

| 命令 | 作用 |
|---|---|
| `pnpm validate` | 配置校验 + 三包类型检查 + 全部测试，**提交前必跑** |
| `pnpm test` | 只跑测试（shared + server） |
| `pnpm typecheck` | 三包类型检查 |
| `pnpm build` | 构建前端到 `web/dist` |
| `pnpm check:font` | 中文字体自检，PDF 导出前必跑 |
| `pnpm samples` | 重新生成 `samples/` 里的虚构企业材料 |

## 三、目录地图

```
config/rules/   规则包（9 道门槛 + 23 项指标 + 10 条假设）——门槛与分值只在这里改
config/catalog/ 字段目录（52 字段）
shared/         零依赖纯函数：打分引擎 + JSON Schema + 指标实现
server/         Express 5 服务：解析链路 / AI 抽取 / 存储 / 报告渲染
web/            Vue 3 前端：客户轻流程 + 管理端
docs/           方案文档（PLAN.md 是主文档）+ 架构、打分、解析三篇
deploy/         宝塔部署手册 + nginx/PM2 配置 + 更新/备份/回滚脚本
data/           运行时数据，永不入库
```

## 四、项目硬性规则

这五条是仓库的既定决策，改动前先确认自己没踩线：

1. **代码零注释** —— 只约束代码文件（`*.ts` / `*.vue`）。本文件等 `.md` / `.yml` 里用中文写说明不受此限。
2. **仅适配桌面端** —— 不做移动端适配。
3. **禁用 axios，统一 `fetch`**。
4. **不引入 Pinia** —— 两个 composable 足够。
5. **CSS 一律 scoped**。

另有三条不可推翻的决策：后端用 Node 而不是 Python（评分引擎前后端共享，便于前端调参实时重算）；前端用 Vue 3 而不是 React；**门槛与分数分离**（门槛不过，分数再高也不通过；提示项不影响结论）。

## 五、改哪里

### 改规则参数只改 `config/rules/`，不改代码

门槛的 `enabled`、`severity`（`hard` / `advisory`）、`reviewExempt`、阈值与权重全部写在规则包里。引擎是**零 I/O 纯函数**，改完不需要动 `shared/src/scoring/`。

> 例外：新增指标实现、改指标公式，才需要改 `shared/src/scoring/indicators/index.ts`。

### 改门槛后必须跑 `pnpm validate`

`pnpm validate` = `node scripts/validate-config.mjs`（配置校验）+ `pnpm typecheck`（三包类型检查）+ `pnpm test`（全部测试）。当前规模：**shared 162 项 + server 158 项**，全部通过才算绿。

> 已知：改了 `config/rules/` 之后，已经出过分的项目不会自动重算（项目创建时绑定了规则版本），这是刻意设计，别去"修"。

### 完成任务后追加 `docs/PLAN.md` 第十一节

第十一节「实施进度」是本项目的实际开发状态记录。**方案与实现不一致时，以第十一节为准**，所以做完一件事要回写对应段落（含验收结果与测试规模）。

## 六、分支与提交

### 分支命名

用 `类型/短描述`，短描述用小写英文或拼音，短横线分隔：

```
feat/gate-table          # 新功能
fix/pdf-mark-font        # 修 bug
docs/plan-progress       # 文档
chore/deps-bump          # 杂项
```

类型词与提交信息一致：`feat` / `fix` / `docs` / `chore` / `refactor` / `test`。

### 提交信息：中文 conventional commits

仓库现有提交信息一律是**中文**的 conventional commits 格式：

```
<类型>(<范围>): <中文描述>
```

真实例子（取自 `git log`）：

```
feat(report): 七项认定指标下移到补足建议之后并默认折叠，PDF 该块移到说明上方
fix(deploy): nginx 配置适配宝塔 Node 项目的新标记，只替换 location / 一段
feat(brand): logo 换成七段柱状上升图形，品牌名统一到小巨人口径
feat(batch5): 新增专精特新 vs 小巨人差异对照页, 默认折叠
docs: PROGRESS 更新到 7 个批次全部完成
chore: 清理临时文件
```

规则：

- 描述用中文，一句话说清**改了什么**，不写"修复了 bug"这种空话，不带句号。
- 范围用小写英文，常用：`report` / `deploy` / `brand` / `portal` / `parse` / `scoring` / `rules` / `web` / `shared` / `batchN`。
- 一个提交只做一件事；改动大就拆成多个提交。

### 提交前

```bash
pnpm validate
```

必须全绿再提交。CI 与本地跑的是同一条命令。

## 七、提 Issue

仓库启用了 Issue 表单，请按类型选：

- **Bug 反馈**（`.github/ISSUE_TEMPLATE/bug_report.yml`）：请如实填**操作系统 / Node 版本 / pnpm 版本**、**复现步骤**、**期望结果**与**实际结果**，并附**相关日志或 PDF**。这四项缺一项就会拖慢排查。
- **功能建议**（`.github/ISSUE_TEMPLATE/feature_request.yml`）：说清使用场景、要解决的问题、期望怎么用。

> 安全漏洞**不要**走公开 issue，流程见 [SECURITY.md](SECURITY.md)。

## 八、提 Pull Request

1. 从 `main` 切分支（见第六节命名）。
2. 改动前先读 `docs/PLAN.md` 第一节（政策核查结论）与第十一节（实施进度）。
3. PR 描述按 [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) 填：关联 issue、改动类型、**自测清单（是否已跑 `pnpm validate`）**、**是否改动规则包或门槛**（是则必须说明并附 `pnpm validate` 结果）。
4. 附上验证证据：改动的截图、测试输出片段、`pnpm validate` 的结果。

### 涉及规则包 / 门槛的 PR

这类改动会影响所有用户的判定结论，评审会重点看：

- 改的是 `config/rules/` 里的参数，还是改了引擎代码？（只改参数是默认做法）
- 是否同步更新了 `docs/PLAN.md` 第十一节？
- `pnpm validate` 是否通过？golden 快照是否按预期更新（golden 变化必须**在 PR 里说明**，不能默默改）？

## 九、行为准则

参与本仓库即表示同意 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 十、商业咨询

项目功能与使用问题的讨论请走 GitHub issue。需要商业咨询的，仓库 `assets/consult-qr.png` 是联系顾问的二维码（请自行扫码，本文不写死任何联系方式文字）。

## 十一、许可与免责声明

本项目采用 [Apache License 2.0](LICENSE) 许可，版权归原作者所有。

本项目输出为**自查参考**，非官方评分；维度权重与三级指标权重均未官方公开，参考得分不可用于申报材料中的自评分数填报。最终认定以培育平台计算与主管部门审核结果为准。