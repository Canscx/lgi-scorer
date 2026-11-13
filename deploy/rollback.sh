#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
PARENT="$(dirname "${ROOT}")"
NAME="$(basename "${ROOT}")"
APP_NAME="${APP_NAME:-lgi}"
BACKUP_DIR="${BACKUP_DIR:-/www/backup/${APP_NAME}}"
SKIP_HEALTH="${SKIP_HEALTH:-0}"

MODE="code"
TARGET=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --list)
      echo "代码快照:${BACKUP_DIR}"
      ls -1th "${BACKUP_DIR}"/${APP_NAME}-code-*.tar.gz 2>/dev/null || echo "  还没有代码快照"
      echo ""
      echo "数据快照:${BACKUP_DIR}"
      ls -1th "${BACKUP_DIR}"/${APP_NAME}-data-*.tar.gz 2>/dev/null || echo "  还没有数据快照"
      exit 0
      ;;
    --data) MODE="data" ;;
    --code) MODE="code" ;;
    -h|--help)
      cat <<'EOF'
用法: bash deploy/rollback.sh [选项] [包路径]

  --list            列出所有代码与数据快照
  (无参数)          回滚代码到最近一份快照
  --data [包路径]   恢复 data/ 数据（不给路径则用最近一份）
  --code [包路径]   同无参数，显式指定
  -h, --help        显示本帮助

环境变量:
  APP_NAME   备份前缀，默认 lgi
  BACKUP_DIR 备份目录，默认 /www/backup/$APP_NAME
  SKIP_HEALTH=1  跳过健康检查（update.sh 自动回滚时用）
EOF
      exit 0
      ;;
    *) TARGET="$1" ;;
  esac
  shift
done

PORT_VALUE="${PORT:-}"
if [ -z "${PORT_VALUE}" ] && [ -f .env ]; then
  PORT_VALUE="$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2 | tr -d '[:space:]')"
fi
PORT_VALUE="${PORT_VALUE:-8788}"

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

restore_data() {
  if [ -z "${TARGET}" ]; then
    TARGET="$(ls -1t "${BACKUP_DIR}"/${APP_NAME}-data-*.tar.gz 2>/dev/null | head -1 || true)"
    if [ -z "${TARGET}" ]; then
      echo "没有找到数据快照。先跑 bash deploy/backup.sh --data"
      exit 1
    fi
    echo "未指定数据包，使用最新一份:$(basename "${TARGET}")"
  fi
  if [ ! -f "${TARGET}" ]; then
    echo "找不到数据包 ${TARGET}"
    exit 1
  fi
  tar -tzf "${TARGET}" > /dev/null

  echo "==> 先把当前 data/ 也备份一份"
  bash "${ROOT}/deploy/backup.sh" --data || true

  echo "==> 恢复 data/，其余目录不动"
  tar -xzf "${TARGET}" -C "${ROOT}"

  echo "==> 重启服务"
  if ! restart_app; then
    echo "命令行没有 pm2 进程 ${APP_NAME}，数据已恢复，请到宝塔「网站 → Node 项目」点【重启】"
    exit 0
  fi
  echo "==> 数据恢复完成"
}

restore_code() {
  if [ -z "${TARGET}" ]; then
    TARGET="$(ls -1t "${BACKUP_DIR}"/${APP_NAME}-code-*.tar.gz 2>/dev/null | head -1 || true)"
    if [ -z "${TARGET}" ]; then
      echo "没有找到代码快照，先跑一次 bash deploy/backup.sh"
      exit 1
    fi
    echo "未指定备份文件，使用最新一份:$(basename "${TARGET}")"
  fi
  if [ ! -f "${TARGET}" ]; then
    echo "找不到备份文件 ${TARGET}"
    exit 1
  fi
  tar -tzf "${TARGET}" > /dev/null

  if ! command -v rsync > /dev/null 2>&1; then
    echo "没有 rsync，改用 tar 直接覆盖（会保留 node_modules / data / .env / fonts）"
    if ! command -v cp > /dev/null 2>&1; then
      echo "也没有 cp，无法恢复。请先安装 rsync: yum install -y rsync 或 apt install -y rsync"
      exit 1
    fi
    USE_TAR_ONLY=1
  fi

  echo "==> 回滚前先把当前代码也备份一份"
  local safety
  safety="$(bash "${ROOT}/deploy/backup.sh")"
  echo "    ${safety}"

  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "${tmp}"' EXIT
  tar -xzf "${TARGET}" -C "${tmp}"

  if [ ! -d "${tmp}/${NAME}" ]; then
    if [ -d "${tmp}/data" ] || [ ! -d "${tmp}/package.json" ]; then
      echo "备份包结构不符合预期(应包含 ${NAME}/ 目录)"
      exit 1
    fi
  fi

  local src="${tmp}/${NAME}"
  if [ ! -d "${src}" ]; then
    echo "备份包缺少 ${NAME}/ 目录，无法恢复"
    exit 1
  fi

  echo "==> 覆盖代码，保留 node_modules / data / release / .env / fonts / .workbuddy"
  if [ "${USE_TAR_ONLY:-0}" = "1" ]; then
    local keep
    keep="$(mktemp -d)"
    for item in node_modules data release .env fonts .workbuddy .tmp; do
      if [ -e "${ROOT}/${item}" ]; then cp -a "${ROOT}/${item}" "${keep}/" 2>/dev/null || true; fi
    done
    find "${ROOT}" -mindepth 1 -maxdepth 1 \
      ! -name '.git' ! -name 'node_modules' ! -name 'data' ! -name 'release' \
      ! -name '.env' ! -name 'fonts' ! -name '.workbuddy' ! -name '.tmp' \
      -exec rm -rf {} +
    cp -a "${src}/." "${ROOT}/"
    for item in node_modules data release .env fonts .workbuddy .tmp; do
      if [ -e "${keep}/${item}" ]; then rm -rf "${ROOT}/${item}"; cp -a "${keep}/${item}" "${ROOT}/"; fi
    done
    rm -rf "${keep}"
  else
    rsync -a --delete \
      --exclude node_modules \
      --exclude data \
      --exclude release \
      --exclude .git \
      --exclude .env \
      --exclude fonts \
      --exclude .workbuddy \
      --exclude .tmp \
      --exclude '*.log' \
      --exclude '*.part' \
      "${src}/" "${ROOT}/"
  fi

  cd "${ROOT}"

  echo "==> 同步依赖"
  pnpm install

  echo "==> 构建前端"
  pnpm build

  if [ "${SKIP_HEALTH}" = "1" ]; then
    echo "==> 跳过健康检查（SKIP_HEALTH=1）"
    return 0
  fi

  echo "==> 重启服务"
  if ! restart_app; then
    echo "命令行没有 pm2 进程 ${APP_NAME}，代码已回滚，请到宝塔「网站 → Node 项目」点【重启】"
    echo ""
    echo "回到线上最新版本: git reset --hard origin/main && bash deploy/update.sh"
    return 0
  fi

  echo "==> 健康检查 http://127.0.0.1:${PORT_VALUE}/api/health"
  local attempt=1
  while [ "${attempt}" -le 5 ]; do
    if health_ok; then
      echo ""
      echo "==> 回滚完成，健康检查通过"
      echo "当前代码是快照内容，不在任何 git 提交上。"
      echo "回到线上最新版本: git reset --hard origin/main && bash deploy/update.sh"
      return 0
    fi
    sleep 2
    attempt=$((attempt + 1))
  done

  echo ""
  echo "==> 健康检查未通过，看日志: pm2 logs ${APP_NAME} --lines 100"
  echo "如果需要再退一步: bash deploy/rollback.sh ${safety}"
  exit 1
}

case "${MODE}" in
  data) restore_data ;;
  *) restore_code ;;
esac