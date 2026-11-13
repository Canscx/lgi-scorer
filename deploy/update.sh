#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

APP_NAME="${APP_NAME:-lgi}"
BACKUP_DIR="${BACKUP_DIR:-/www/backup/${APP_NAME}}"
KEEP="${KEEP:-10}"

WITH_DATA=0
DO_PULL=1
DO_INSTALL=1
DO_ROLLBACK=1

usage() {
  cat <<'EOF'
用法: bash deploy/update.sh [选项]

  (无参数)          备份代码 → git pull → pnpm install → pnpm build → 重启 → 健康检查
  --with-data       连 data/ 一起备份(企业材料、打分结果、模型配置)
  --no-pull         跳过 git pull,只重建并重启(改完 .env、字体、nginx 后用)
  --skip-install    跳过 pnpm install,只构建与重启
  --no-rollback     健康检查失败时保持现状,不自动回滚
  -h, --help        显示本帮助

环境变量:
  APP_NAME     进程名与备份前缀，默认 lgi
  BACKUP_DIR   备份目录，默认 /www/backup/$APP_NAME
  KEEP         代码快照保留份数，默认 10
  PORT         服务端口，默认读 .env 的 PORT，再退回 8788
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --with-data) WITH_DATA=1 ;;
    --no-pull) DO_PULL=0 ;;
    --skip-install) DO_INSTALL=0 ;;
    --no-rollback) DO_ROLLBACK=0 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数 $1"; usage; exit 1 ;;
  esac
  shift
done

say() { echo "==> $*"; }
warn() { echo "!!  $*"; }

rollback_hint() {
  echo ""
  echo "本次更新前的快照:${CODE_BACKUP}"
  if [ -n "${DATA_BACKUP}" ]; then echo "本次数据快照:    ${DATA_BACKUP}"; fi
  echo "回滚代码:  bash deploy/rollback.sh"
  echo "恢复数据:  bash deploy/rollback.sh --data ${DATA_BACKUP:-<数据包路径>}"
  if [ "${SHA_BEFORE}" != "nogit" ]; then
    echo "退回提交:  git reset --hard ${SHA_BEFORE} && pnpm install && pnpm build，再重启进程"
  fi
}

auto_rollback() {
  echo ""
  if [ "${SHA_BEFORE}" != "nogit" ] && [ -d .git ]; then
    say "自动回滚代码到 ${SHA_BEFORE}"
    if git reset --hard "${SHA_BEFORE}" > /dev/null 2>&1; then
      say "    已回到 ${SHA_BEFORE}，重新安装依赖并构建"
      pnpm install && pnpm build || {
        warn "回滚后重新构建仍失败，需要人工介入"
        return 1
      }
      if restart_app; then
        wait_health && say "回滚完成，服务已恢复" || warn "回滚后健康检查仍未通过，看日志: pm2 logs ${APP_NAME} --lines 100"
      else
        warn "回滚完成，但命令行没有 pm2 进程 ${APP_NAME}，请到宝塔面板点【重启】"
      fi
      return 0
    fi
    warn "git reset --hard 失败，改用 tar 快照回滚"
  fi
  say "用 tar 快照回滚: ${CODE_BACKUP}"
  SKIP_HEALTH=1 bash "${ROOT}/deploy/rollback.sh" "${CODE_BACKUP}" || {
    warn "tar 快照回滚也失败了"
    return 1
  }
  return 0
}

PORT_VALUE="${PORT:-}"
if [ -z "${PORT_VALUE}" ] && [ -f .env ]; then
  PORT_VALUE="$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2 | tr -d '[:space:]')"
fi
PORT_VALUE="${PORT_VALUE:-8788}"

running_commit() {
  local body
  body="$(curl -sf "http://127.0.0.1:${PORT_VALUE}/api/health" 2>/dev/null || true)"
  printf '%s' "${body}" | sed -n 's/.*"commit":"\([0-9a-f][0-9a-f]*\)".*/\1/p' | head -1
}

health_ok() {
  curl -sf "http://127.0.0.1:${PORT_VALUE}/api/health" > /dev/null 2>&1
}

pm2_ready() {
  command -v pm2 > /dev/null 2>&1 && pm2 describe "${APP_NAME}" > /dev/null 2>&1
}

restart_app() {
  if pm2_ready; then
    pm2 restart "${APP_NAME}" > /dev/null
    return 0
  fi
  return 1
}

wait_health() {
  local attempt=1
  while [ "${attempt}" -le 10 ]; do
    if health_ok; then return 0; fi
    sleep 2
    attempt=$((attempt + 1))
  done
  return 1
}

echo ""
say "项目目录 ${ROOT}"
say "进程名   ${APP_NAME}"
say "端口     ${PORT_VALUE}"
echo ""

if [ ! -d .git ] && [ "${DO_PULL}" = "1" ]; then
  warn "当前目录不是 git 仓库，无法 git pull"
  warn "先手工放好代码，然后用 bash deploy/update.sh --no-pull 重建并重启"
  exit 1
fi

if [ -d .git ] && [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  warn "有已跟踪文件被本地改过，先处理再更新:"
  git status --short --untracked-files=no
  warn "确实要丢弃服务器上的手改，先跑 git checkout -- . 再重来"
  exit 1
fi

SHA_BEFORE="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"

say "备份当前代码"
CODE_BACKUP="$(bash "${ROOT}/deploy/backup.sh")"
say "    快照 ${CODE_BACKUP}"
say "    提交 ${SHA_BEFORE}"
echo ""

DATA_BACKUP=""
if [ "${WITH_DATA}" = "1" ]; then
  say "备份数据目录 data/"
  DATA_BACKUP="$(bash "${ROOT}/deploy/backup.sh" --data)" || true
  say "    快照 ${DATA_BACKUP}"
  echo ""
fi

if [ "${DO_PULL}" = "1" ]; then
  say "拉取 ${BRANCH} 最新代码"
  git fetch --prune origin
  SHA_REMOTE="$(git rev-parse --short "origin/${BRANCH}" 2>/dev/null || echo "")"
  if [ -n "${SHA_REMOTE}" ] && [ "${SHA_REMOTE}" = "${SHA_BEFORE}" ]; then
    say "已是最新提交 ${SHA_BEFORE}，没有新代码"
  else
    git pull --ff-only
    say "    ${SHA_BEFORE} → $(git rev-parse --short HEAD)"
  fi
  echo ""
fi

if [ "${DO_INSTALL}" = "1" ]; then
  say "同步依赖"
  pnpm install
  echo ""
fi

HEAD_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"

say "构建前端"
if ! pnpm build; then
  warn "构建失败，磁盘上已是新代码但 web/dist 不完整"
  if [ "${DO_ROLLBACK}" = "1" ]; then
    if auto_rollback; then
      rollback_hint
      exit 1
    fi
    warn "自动回滚失败，代码可能停在 ${HEAD_SHA:-新提交} 上，请人工处理"
    rollback_hint
    exit 1
  fi
  warn "手动回滚: bash deploy/rollback.sh ${CODE_BACKUP}"
  exit 1
fi
echo ""

say "字体自检"
pnpm check:font || warn "字体自检未通过：PDF 导出可能失败，按上面列出的候选位置补字体后重启"


echo ""
say "重启服务"
if ! restart_app; then
  warn "命令行没有 pm2 进程 ${APP_NAME}，代码与依赖已更新，但进程未重启"
  warn "请到宝塔「网站 → Node 项目」点【重启】，再访问页面确认版本"
  if health_ok; then
    RUNNING="$(running_commit)"
    if [ "${HEAD_SHA}" != "nogit" ] && [ -n "${RUNNING}" ] && [ "${RUNNING}" != "${HEAD_SHA}" ]; then
      warn "进程仍在跑 ${RUNNING}，磁盘上已是 ${HEAD_SHA}"
      warn "重启之前，本次新增的接口会返回「接口不存在」"
    fi
  fi
  rollback_hint
  exit 0
fi

say "健康检查 http://127.0.0.1:${PORT_VALUE}/api/health"
if wait_health; then
  RUNNING="$(running_commit)"
  if [ "${HEAD_SHA}" != "nogit" ] && [ -n "${RUNNING}" ] && [ "${RUNNING}" != "${HEAD_SHA}" ]; then
    warn "进程跑的还是 ${RUNNING}，磁盘上已是 ${HEAD_SHA}"
    warn "重启没生效，或重启的不是这个项目。新接口会返回「接口不存在」"
    if [ "${DO_ROLLBACK}" = "1" ]; then
      auto_rollback || warn "自动回滚失败，请人工处理"
      rollback_hint
      exit 1
    fi
    rollback_hint
    exit 1
  fi
  echo ""
  say "部署完成，健康检查通过${RUNNING:+，进程提交 ${RUNNING}}"
  if [ "$(id -u)" = "0" ]; then
    echo "提示:本次以 root 执行，若 Node 项目以 www 运行，建议 chown -R www:www ${ROOT}"
  fi
  rollback_hint
  exit 0
fi

warn "健康检查未通过，进程可能没起来。看日志: pm2 logs ${APP_NAME} --lines 100"
if [ "${DO_ROLLBACK}" = "1" ]; then
  auto_rollback || warn "自动回滚失败，请人工处理"
  rollback_hint
  exit 1
fi
rollback_hint
exit 1