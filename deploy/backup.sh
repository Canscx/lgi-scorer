#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
PARENT="$(dirname "${ROOT}")"
NAME="$(basename "${ROOT}")"
APP_NAME="${APP_NAME:-lgi}"
BACKUP_DIR="${BACKUP_DIR:-/www/backup/${APP_NAME}}"
KEEP="${KEEP:-10}"
KEEP_DATA="${KEEP_DATA:-${KEEP}}"

MODE="code"
case "${1:-}" in
  --data) MODE="data" ;;
  --all) MODE="all" ;;
  --code) MODE="code" ;;
  "") MODE="code" ;;
  -h|--help)
    cat <<'EOF'
用法: bash deploy/backup.sh [选项]

  (无参数)   备份代码快照，打印 tar 包绝对路径
  --data     备份 data/ 运行时数据
  --all      代码与数据各备一份
  -h         显示本帮助

环境变量:
  APP_NAME   备份前缀，默认 lgi
  BACKUP_DIR 备份目录，默认 /www/backup/$APP_NAME
  KEEP       代码快照保留份数，默认 10
  KEEP_DATA  数据快照保留份数，默认同 KEEP
EOF
    exit 0
    ;;
  *) echo "未知参数 $1"; exit 1 ;;
esac

STAMP="$(date +%Y%m%d-%H%M%S)"
SHA="nogit"
if [ -d .git ] && command -v git > /dev/null 2>&1; then
  SHA="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
fi

mkdir -p "${BACKUP_DIR}"

prune() {
  local pattern="$1"
  local keep="$2"
  ls -1t "${BACKUP_DIR}"/${pattern} 2>/dev/null | tail -n +$((keep + 1)) | while read -r old; do
    rm -f "${old}"
    echo "清理旧备份 $(basename "${old}")" >&2
  done
}

backup_code() {
  local file="${BACKUP_DIR}/${APP_NAME}-code-${STAMP}-${SHA}.tar.gz"
  echo "备份代码到 ${file}" >&2
  tar -czf "${file}" \
    --exclude='*/node_modules' \
    --exclude='*/data' \
    --exclude='*/release' \
    --exclude='*/dist' \
    --exclude='*/.git' \
    --exclude='*/.tmp' \
    --exclude='*/.workbuddy' \
    --exclude='*/fonts' \
    --exclude='*/.env' \
    --exclude='*.log' \
    -C "${PARENT}" "${NAME}"
  if [ ! -s "${file}" ]; then
    echo "备份失败，${file} 没有生成，已中止" >&2
    exit 1
  fi
  prune "${APP_NAME}-code-*.tar.gz" "${KEEP}"
  echo "${file}"
}

backup_data() {
  if [ ! -d data ]; then
    echo "没有 data/ 目录，跳过数据备份" >&2
    return 1
  fi
  local file="${BACKUP_DIR}/${APP_NAME}-data-${STAMP}.tar.gz"
  echo "备份数据到 ${file}" >&2
  tar -czf "${file}" -C "${ROOT}" data
  if [ ! -s "${file}" ]; then
    echo "备份失败，${file} 没有生成，已中止" >&2
    exit 1
  fi
  prune "${APP_NAME}-data-*.tar.gz" "${KEEP_DATA}"
  echo "${file}"
}

case "${MODE}" in
  code)
    backup_code
    ;;
  data)
    backup_data
    ;;
  all)
    backup_code
    backup_data
    ;;
esac
