# 部署手册 · 宝塔面板

> 第一次部署请先看手把手教程：[宝塔部署教程.md](./宝塔部署教程.md)，本文是参数与原理的速查手册。

面向内网小团队的部署方式：一台服务器、一个 Node 进程、一个共享账号。
**不是多租户方案** —— 所有访问者看到同一份数据，没有用户身份区分。

## 一、前置条件

| 项 | 要求 | 说明 |
|---|---|---|
| 服务器 | 2 核 4G 起 | pdfjs 逐页渲染 2000px 页图，1 核 2G 解析大 PDF 会 OOM |
| 系统 | Ubuntu 22 / CentOS 7+ | 需要能装 Node 22 |
| Node | 22.x | 项目 `engines` 要求 ≥ 20.11 |
| 域名 | 已备案 | 国内服务器未备案，80 / 443 会被拦 |
| 磁盘 | 40G 起 | 每个 50 页项目的页图约几十 MB |
| 端口 | **8788** | 与专精特新站（8787）错开，同机部署互不干扰 |

## 二、首次部署

### 1. 装 Node 22

宝塔 → 软件商店 → Node.js 版本管理器 → 安装 v22 → 设为命令行默认版本。

```bash
node -v
pnpm -v
```

没有 pnpm 就 `npm i -g pnpm`。

### 2. 放代码

```bash
mkdir -p /www/wwwroot/lgi
cd /www/wwwroot/lgi
git clone <仓库地址> .
```

不用 git 就把代码打包上传解压到该目录，**排除 `node_modules`、`release`、`data`、`.tmp`**。

### 3. 装依赖并构建

```bash
cd /www/wwwroot/lgi
pnpm install
pnpm build
```

`pnpm install` **不要加 `--prod`**。`tsx` 在 devDependencies 里，过滤掉就启动不了。

### 4. 装中文字体

查找顺序：`REPORT_FONT_PATH` → 项目根 `fonts/` → 系统字体（Noto CJK / 文泉驿 / 黑体 / 苹方）→ `fc-match`。

Debian / Ubuntu：

```bash
apt install -y fonts-noto-cjk
```

RHEL / CentOS / OpenCloudOS / 麒麟：

```bash
dnf install -y wqy-zenhei-fonts
```

装完必须自检一次：

```bash
cd /www/wwwroot/lgi
pnpm check:font
```

`.ttc` 集合字体由程序读取内部 PostScript 名，不用手工指定 family。字体变动后重启进程生效。

### 5. 起进程

宝塔 → 网站 → Node 项目 → 添加：

| 字段 | 值 |
|---|---|
| 项目目录 | `/www/wwwroot/lgi` |
| 启动选项 | `node_modules/.bin/tsx server/src/index.ts` |
| 项目端口 | `8788` |
| 运行用户 | `www` |
| 实例数 | **1** |

实例数必须是 1。任务进度的 SSE 是进程内存广播，存储锁是进程内 Map，开两个进程会丢事件、抢写文件。

命令行方式可用 `deploy/ecosystem.config.cjs`：

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

### 6. 目录权限

```bash
chown -R www:www /www/wwwroot/lgi
chmod -R 755 /www/wwwroot/lgi
```

`data/` 必须可写，否则上传与解析全部失败。

### 7. 反向代理 + HTTPS

宝塔 → 网站 → 添加站点（纯静态即可，域名绑定好） → SSL → Let's Encrypt 申请 → 开「强制 HTTPS」。

然后 网站 → 设置 → 配置文件，找到 `#PROXY-START` 到 `#PROXY-END`，整段替换为 `deploy/nginx-site.conf` 的内容。

```bash
nginx -t && nginx -s reload
```

宝塔内置的「反向代理」功能与「加密访问」功能都会覆盖这段配置，**改完不要再点那两个按钮**。

## 三、访问保护

访问保护内置在应用里：打开域名先看到登录页，两个账号分别进后台与客户流程。

| 项 | 值 |
| --- | --- |
| 管理员账号 | `admin` |
| 管理员密码 | `abc123456/` |
| 客户账号 | `customer` |
| 客户密码 | `vip666666` |
| 会话有效期 | 30 天（HttpOnly Cookie，服务重启后需重新登录） |
| 修改方式 | 环境变量 `AUTH_USER` / `AUTH_PASSWORD` / `AUTH_CUSTOMER` / `AUTH_CUSTOMER_PASSWORD`，改完重启 |

行为细节：

- 登录失败有约 0.8 秒延迟，自动爆破每秒最多试一次
- 密码比对用恒定时间比较，不存在逐位探测
- 会话凭证是 32 字节随机数，存在 HttpOnly Cookie 里，前端脚本读不到
- **不要**再开宝塔面板的「加密访问」——那个功能会让反向代理失效，表现为登录页之后白屏

强改 HTTPS 依然是硬要求。

## 四、AI 模型配置

登录后在页面右上角「模型设置」里填，保存即生效，不用重启。

配置落在 `data/ai-settings.json`，**优先级高于环境变量** —— 所以想用环境变量藏 Key 是没用的，只要有人能在页面改。

默认接入 DeepSeek：

```
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-flash
```

多人共用一个 Key 时注意：token 消耗记在 `data/projects/<id>/ai-usage.json`，按项目分开，但没有按人统计。

### 与本项目相关的模型能力要求

| 能力 | 用途 |
|---|---|
| 文本 | 从财报 / 税表文本层抽取 52 个字段 |
| 视觉 | 扫描件识别（营业执照、扫描版税表） |
| JSON 输出 | 抽取结果的结构化返回 |

## 五、日常运维

### 备份

两类备份，互不干扰：

```
/www/backup/
├── lgi-2026-11-05.tar.gz              # 数据，每天一份
└── lgi/
    ├── lgi-code-20261105-171000-025ea33.tar.gz   # 代码，每次更新一份
    └── lgi-code-20261104-090000-6d7ccf8.tar.gz
```

数据备份：

```bash
tar -czf /www/backup/lgi-$(date +%F).tar.gz -C /www/wwwroot/lgi data
find /www/backup -maxdepth 1 -name "lgi-*.tar.gz" -mtime +7 -delete
```

`-maxdepth 1` 不能省：不加会把 `/www/backup/lgi/` 里的代码快照一起删掉。

### 更新

| 要做的事 | 命令 |
| --- | --- |
| 更新到最新代码（自动先备份） | `bash deploy/update.sh` |
| 手动存一份代码快照 | `bash deploy/backup.sh` |
| 回滚到某个快照 | `bash deploy/rollback.sh [包路径]` |

它按顺序做完：检查工作区 → **备份当前代码** → `git pull --ff-only` → `pnpm install` → `pnpm build` → `pnpm check:font` → 重启 → 轮询 `/api/health`。

**进程版本自检**：`/api/health` 的 `runtime.commit` 是进程启动时读到的提交号。

```bash
curl -s http://127.0.0.1:8788/api/health | grep -o '"commit":"[^"]*"'
git rev-parse --short HEAD
```

### 回滚

```bash
bash deploy/rollback.sh --list        # 看有哪些快照
bash deploy/rollback.sh               # 恢复最近一份
```

回滚会保留 `node_modules` / `data` / `release` / `.env` / `fonts`。

### 日志

```bash
pm2 logs lgi --lines 200
```

## 六、排错

| 现象 | 原因 | 处理 |
|---|---|---|
| 启动即退出 | 用 `--prod` 装了依赖，缺 tsx | 重跑 `pnpm install` |
| 页面白屏 / 静态资源 404 | 没跑 `pnpm build` | 跑一次构建 |
| 启动报端口占用 | 8788 被占用 | `ss -lntp | grep 8788`，或改 `.env` 的 PORT |
| 新功能报「接口不存在」(404) | 进程跑的还是旧代码 | 看 `runtime.commit` 是否等于磁盘 HEAD，不等就重启 |
| 上传 PDF 报 413 | nginx 默认 1MB | 配 `client_max_body_size 60m` |
| 解析进度条不动 | SSE 被缓冲 | 配 `proxy_buffering off` |
| 结果页没有「七项认定指标」 | 旧构建或浏览器缓存 | `pnpm build` 后重启 + Ctrl+F5 |
| 导出 PDF 报 500 `report_font_missing` | 没有可用中文字体 | 做第二步第 4 小步；`pnpm check:font` 会列出失败原因 |
| 登录页之后白屏 | 用了面板「加密访问」 | 删掉它，反代用 `deploy/nginx-site.conf` |
| 页面标题是「专精特新申报自评打分系统」 | 打开的是另一个站 | 确认域名反代指向 8788 |
| 任务进度错乱 / 文件损坏 | 开了多实例 | 实例数改回 1 |
| 上传后立刻 500 | `data/` 无写权限 | `chown -R www:www` |

### 健康检查

```bash
curl http://127.0.0.1:8788/api/health
```

关键字段：

```json
"service": "lgi-scorer"
"rules": { "id": "rules.lgi.v1.0.0", "level": "LITTLE_GIANT", "gates": 9, "indicators": 23 }
```

## 七、这套方案不解决什么

- 没有用户身份，日志里区分不出谁改的证据
- 没有数据隔离，所有人看到同一个工作台
- 没有按人限额，一个 Key 大家一起烧
- 没有操作审计

要多租户、要客户自助、要计费 —— 那是产品改造，不是运维配置。
