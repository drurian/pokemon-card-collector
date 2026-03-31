#!/usr/bin/env bash

set -euo pipefail

CONFIG_PATH="${DB_BACKUP_CONFIG:-/etc/db-backup.conf}"

resolve_path() {
  local path_value="$1"
  local base_dir="$2"
  if [[ "$path_value" == /* ]]; then
    printf '%s\n' "$path_value"
    return
  fi
  printf '%s/%s\n' "$base_dir" "$path_value"
}

locate_default_env_file() {
  local file_name="$1"
  local config_base_dir="$2"
  local cwd script_dir
  cwd="$(pwd -P)"
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

  local candidates=(
    "$cwd/$file_name"
    "$cwd/../$file_name"
    "$config_base_dir/$file_name"
    "$script_dir/$file_name"
    "$script_dir/../$file_name"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

load_dotenv() {
  local dotenv_path="$1"
  if [[ ! -f "$dotenv_path" ]]; then
    echo "Env file not found: $dotenv_path" >&2
    exit 1
  fi
  set -a
  # shellcheck source=/dev/null
  source "$dotenv_path"
  set +a
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required config variable: $name" >&2
    exit 1
  fi
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command is missing: $cmd" >&2
    exit 1
  fi
}

resolve_compose_command() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
    return 0
  fi
  return 1
}

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Config file not found: $CONFIG_PATH" >&2
  exit 1
fi

config_dir="$(cd "$(dirname "$CONFIG_PATH")" && pwd -P)"

# Load backup config first so APP_ENV settings can be defined there.
# shellcheck source=/dev/null
source "$CONFIG_PATH"

APP_ENV_FILE="${APP_ENV_FILE:-.env.prod}"
if [[ "$APP_ENV_FILE" == /* ]]; then
  dotenv_path="$APP_ENV_FILE"
elif [[ -n "${APP_ENV_BASE_DIR:-}" ]]; then
  env_base_dir="$(resolve_path "$APP_ENV_BASE_DIR" "$config_dir")"
  dotenv_path="$(resolve_path "$APP_ENV_FILE" "$env_base_dir")"
else
  if ! dotenv_path="$(locate_default_env_file "$APP_ENV_FILE" "$config_dir")"; then
    echo "Unable to locate $APP_ENV_FILE automatically. Set APP_ENV_BASE_DIR or APP_ENV_FILE in $CONFIG_PATH." >&2
    exit 1
  fi
fi

load_dotenv "$dotenv_path"
LOADED_APP_ENV_FILE="$dotenv_path"

# Re-load config so backup-specific overrides can win over .env values.
# shellcheck source=/dev/null
source "$CONFIG_PATH"

LOG_TAG="${LOG_TAG:-db-backup}"
DB_ENGINE="${DB_ENGINE:-mysql}"
MYSQL_DUMP_MODE="${MYSQL_DUMP_MODE:-auto}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/db}"
RETENTION_COUNT="${RETENTION_COUNT-14}"
RETENTION_DAYS="${RETENTION_DAYS:-}"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-6}"
UPLOAD_TARGET="${UPLOAD_TARGET:-none}"
LOCK_FILE="${LOCK_FILE:-/var/lock/db-backup.lock}"
DOCKER_DB_SERVICE="${DOCKER_DB_SERVICE:-db}"
DB_HOST="${DB_HOST:-127.0.0.1}"
if [[ -z "${DB_PORT:-}" ]]; then
  if [[ "$DB_ENGINE" == "postgres" ]]; then
    DB_PORT="5432"
  else
    DB_PORT="3306"
  fi
fi
DOCKER_COMPOSE_BASE_DIR="${DOCKER_COMPOSE_BASE_DIR:-$(dirname "$LOADED_APP_ENV_FILE")}"
DOCKER_COMPOSE_BASE_DIR="$(resolve_path "$DOCKER_COMPOSE_BASE_DIR" "$config_dir")"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.prod.yml}"
DOCKER_COMPOSE_FILE="$(resolve_path "$DOCKER_COMPOSE_FILE" "$DOCKER_COMPOSE_BASE_DIR")"
DOCKER_COMPOSE_ENV_FILE="${DOCKER_COMPOSE_ENV_FILE:-$LOADED_APP_ENV_FILE}"
DOCKER_COMPOSE_ENV_FILE="$(resolve_path "$DOCKER_COMPOSE_ENV_FILE" "$DOCKER_COMPOSE_BASE_DIR")"

require_cmd gzip
require_cmd sha256sum
require_cmd logger
require_cmd flock
require_var DB_NAME

timestamp="$(date +%Y%m%d-%H%M%S)"
base_name="${DB_ENGINE}-${DB_NAME}-${timestamp}"
tmp_sql="$BACKUP_DIR/${base_name}.sql"
tmp_gz="${tmp_sql}.gz.tmp"
final_gz="$BACKUP_DIR/${base_name}.sql.gz"
checksum_file="${final_gz}.sha256"
tmp_checksum="${checksum_file}.tmp"
tmp_log="${BACKUP_DIR}/${base_name}.log.tmp"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
umask 0077

log() {
  local level="$1"
  shift
  local message="$*"
  echo "[$(date '+%F %T')] $message"
  logger -t "$LOG_TAG" -p "user.${level}" -- "$message"
}

if [[ -n "${LOADED_APP_ENV_FILE:-}" ]]; then
  log info "Loaded app env file: $LOADED_APP_ENV_FILE"
fi

cleanup_tmp() {
  rm -f "$tmp_sql" "$tmp_gz" "$tmp_checksum" "$tmp_log"
}
trap cleanup_tmp EXIT

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log warning "Backup already running, exiting."
  exit 0
fi

dump_mysql() {
  local mode="$MYSQL_DUMP_MODE"
  if [[ "$mode" == "auto" ]]; then
    if [[ -f "$DOCKER_COMPOSE_FILE" ]] && resolve_compose_command; then
      mode="docker"
    else
      mode="host"
    fi
  fi

  case "$mode" in
    docker)
      require_var DB_NAME
      require_var DB_USER
      require_var DB_PASSWORD
      if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        log err "DOCKER_COMPOSE_FILE not found: $DOCKER_COMPOSE_FILE"
        exit 1
      fi
      if [[ ! -f "$DOCKER_COMPOSE_ENV_FILE" ]]; then
        log err "DOCKER_COMPOSE_ENV_FILE not found: $DOCKER_COMPOSE_ENV_FILE"
        exit 1
      fi
      if ! resolve_compose_command; then
        log err "Docker Compose is required for MYSQL_DUMP_MODE=docker"
        exit 1
      fi
      "${COMPOSE_CMD[@]}" --env-file "$DOCKER_COMPOSE_ENV_FILE" -f "$DOCKER_COMPOSE_FILE" exec -T \
        -e "DB_NAME=$DB_NAME" \
        -e "DB_USER=$DB_USER" \
        -e "DB_PASSWORD=$DB_PASSWORD" \
        "$DOCKER_DB_SERVICE" \
        sh -lc 'exec mariadb-dump --single-transaction --quick --routines --triggers --events -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"' >"$tmp_sql"
      ;;
    host)
      require_var DB_NAME
      require_var DB_USER
      require_var DB_PASSWORD
      require_cmd mysqldump
      MYSQL_PWD="$DB_PASSWORD" mysqldump \
        --single-transaction \
        --quick \
        --routines \
        --triggers \
        --events \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        "$DB_NAME" >"$tmp_sql"
      ;;
    *)
      log err "Unsupported MYSQL_DUMP_MODE: $mode (allowed: auto, host, docker)"
      exit 1
      ;;
  esac
}

dump_postgres() {
  require_var DB_NAME
  require_var DB_USER
  require_var DB_PASSWORD
  require_cmd pg_dump
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    --format=plain \
    --no-owner \
    --no-privileges \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    "$DB_NAME" >"$tmp_sql"
}

upload_rclone_target() {
  require_cmd rclone
  local remote_name="$1"
  local remote_path_root="$2"
  local remote_path="${remote_name}:${remote_path_root%/}"
  rclone copyto "$final_gz" "$remote_path/$(basename "$final_gz")" >>"$tmp_log" 2>&1
  rclone copyto "$checksum_file" "$remote_path/$(basename "$checksum_file")" >>"$tmp_log" 2>&1
}

upload_cloud() {
  require_var CLOUD_REMOTE
  require_var CLOUD_PATH
  upload_rclone_target "$CLOUD_REMOTE" "$CLOUD_PATH"
}

upload_google_drive() {
  require_var GOOGLE_DRIVE_REMOTE
  require_var GOOGLE_DRIVE_PATH
  upload_rclone_target "$GOOGLE_DRIVE_REMOTE" "$GOOGLE_DRIVE_PATH"
}

prune_local_backups() {
  if [[ -n "$RETENTION_DAYS" ]]; then
    if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
      log err "RETENTION_DAYS must be an integer, got: $RETENTION_DAYS"
      exit 1
    fi
    if (( RETENTION_DAYS < 1 )); then
      log err "RETENTION_DAYS must be >= 1"
      exit 1
    fi
    local minutes=$((RETENTION_DAYS * 24 * 60))
    mapfile -t old_backups < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DB_ENGINE}-${DB_NAME}-*.sql.gz" -mmin +"$minutes" | sort)
    local old_file
    for old_file in "${old_backups[@]}"; do
      rm -f "$old_file" "${old_file}.sha256"
    done
  fi

  if [[ -n "$RETENTION_COUNT" ]]; then
    local keep="$RETENTION_COUNT"
    if ! [[ "$keep" =~ ^[0-9]+$ ]]; then
      log err "RETENTION_COUNT must be an integer, got: $keep"
      exit 1
    fi
    if (( keep < 1 )); then
      log err "RETENTION_COUNT must be >= 1"
      exit 1
    fi

    mapfile -t backups < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DB_ENGINE}-${DB_NAME}-*.sql.gz" | sort)
    local total="${#backups[@]}"
    if (( total <= keep )); then
      return
    fi

    local delete_count=$((total - keep))
    local i
    for ((i = 0; i < delete_count; i++)); do
      rm -f "${backups[$i]}" "${backups[$i]}.sha256"
    done
  fi
}

log info "Backup start: engine=$DB_ENGINE db=$DB_NAME target=$BACKUP_DIR"
if [[ "$DB_ENGINE" == "mysql" ]]; then
  log info "MySQL dump mode: $MYSQL_DUMP_MODE"
fi

case "$DB_ENGINE" in
  mysql)
    dump_mysql
    ;;
  postgres)
    dump_postgres
    ;;
  *)
    log err "Unsupported DB_ENGINE: $DB_ENGINE (allowed: mysql, postgres)"
    exit 1
    ;;
esac

gzip -"$COMPRESSION_LEVEL" -c "$tmp_sql" >"$tmp_gz"
mv "$tmp_gz" "$final_gz"
sha256sum "$final_gz" >"$tmp_checksum"
mv "$tmp_checksum" "$checksum_file"

case "$UPLOAD_TARGET" in
  none)
    ;;
  cloud)
    upload_cloud
    log info "Cloud upload complete for $(basename "$final_gz")"
    ;;
  google-drive)
    upload_google_drive
    log info "Google Drive upload complete for $(basename "$final_gz")"
    ;;
  *)
    log err "Unsupported UPLOAD_TARGET: $UPLOAD_TARGET (allowed: none, cloud, google-drive)"
    exit 1
    ;;
esac

prune_local_backups

size_bytes="$(wc -c <"$final_gz" | tr -d ' ')"
log info "Backup complete: file=$(basename "$final_gz") size_bytes=$size_bytes"
