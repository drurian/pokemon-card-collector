# Database Backup on Hetzner

This bundle provides:
- Local-first DB backups with retention and checksums
- Optional cloud upload (using `rclone`)
- `systemd` scheduling (recommended) with cron alternative

## Files

- `db-backup.sh`: main backup script
- `db-backup.conf.example`: config template
- `systemd/db-backup.service`: oneshot service unit
- `systemd/db-backup.timer`: nightly timer unit

## 1) Install on the server

```bash
sudo install -m 750 db-backup.sh /usr/local/bin/db-backup.sh
sudo install -m 644 systemd/db-backup.service /etc/systemd/system/db-backup.service
sudo install -m 644 systemd/db-backup.timer /etc/systemd/system/db-backup.timer
sudo install -m 600 db-backup.conf.example /etc/db-backup.conf
```

Then edit `/etc/db-backup.conf` with backup settings.

Default credential source:
- `.env.prod`

Path behavior:
- `APP_ENV_FILE` may be absolute or relative.
- If relative and `APP_ENV_BASE_DIR` is set, it is resolved from `APP_ENV_BASE_DIR`.
- If `APP_ENV_BASE_DIR` is omitted, `.env.prod` is auto-discovered in common locations (`cwd`, parent of `cwd`, config dir, script dir, parent of script dir).
- For deterministic behavior in production, set `APP_ENV_BASE_DIR` explicitly.

Precedence:
- `APP_ENV_FILE` values load first.
- Then `/etc/db-backup.conf` is applied as overrides.
- To force `DB_PASSWORD` to come from `.env.prod`, do not set `DB_PASSWORD` in `/etc/db-backup.conf` (leave it commented out).

If using PostgreSQL:
- set `DB_ENGINE=postgres`
- set `DB_PORT=5432` (or your custom port)

If using MySQL/MariaDB:
- keep `DB_ENGINE=mysql`
- default `MYSQL_DUMP_MODE=auto` (prefers Docker Compose when available)
- set `DB_PORT=3306` (or your custom port)

MySQL dump mode:
- `MYSQL_DUMP_MODE=auto`: uses Docker Compose dump when `DOCKER_COMPOSE_FILE` is found; otherwise host `mysqldump`.
- `MYSQL_DUMP_MODE=docker`: always dumps from the DB container (`DOCKER_DB_SERVICE`, default `db`).
- `MYSQL_DUMP_MODE=host`: always uses host `mysqldump` with `DB_HOST/DB_PORT`.

## 2) Create least-privileged backup user

MySQL/MariaDB example:
```sql
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'strong-password';
GRANT SELECT, SHOW VIEW, TRIGGER, EVENT, LOCK TABLES ON pokemon_collector.* TO 'backup_user'@'localhost';
FLUSH PRIVILEGES;
```

PostgreSQL example:
```sql
CREATE ROLE backup_user LOGIN PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE pokemon_collector TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup_user;
```

## 3) Enable schedule

Recommended (`systemd`):
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now db-backup.timer
sudo systemctl list-timers db-backup.timer
```

Run once immediately:
```bash
sudo systemctl start db-backup.service
sudo journalctl -u db-backup.service -n 100 --no-pager
```

Cron alternative:
```cron
0 2 * * * /usr/local/bin/db-backup.sh
```

## 4) Enable cloud upload (optional)

1. Install and configure `rclone` remote.
2. Update `/etc/db-backup.conf`:
   - `UPLOAD_TARGET=cloud`
   - `CLOUD_REMOTE=<rclone remote name>`
   - `CLOUD_PATH=<bucket/path>`
3. Run one manual backup and verify upload.

## 5) Restore examples

MySQL/MariaDB restore:
```bash
gunzip -c /var/backups/db/mysql-pokemon_collector-YYYYmmdd-HHMMSS.sql.gz | \
  mysql -h 127.0.0.1 -P 3306 -u root -p pokemon_collector
```

PostgreSQL restore:
```bash
gunzip -c /var/backups/db/postgres-pokemon_collector-YYYYmmdd-HHMMSS.sql.gz | \
  psql -h 127.0.0.1 -p 5432 -U postgres -d pokemon_collector
```

## Notes

- Backups are written to local disk first, then optionally copied to cloud.
- `RETENTION_DAYS=14` deletes backups older than 2 weeks.
- `RETENTION_COUNT` is optional and can cap total backup count if set.
- Each backup has a SHA-256 file (`.sha256`) for integrity checks.

## Troubleshooting

If `db-backup.service` fails under `systemd` but works manually, set explicit paths in `/etc/db-backup.conf`:
- `APP_ENV_BASE_DIR=/home/deploy/pokemon-card-collector`
- `DOCKER_COMPOSE_BASE_DIR=/home/deploy/pokemon-card-collector`
- `MYSQL_DUMP_MODE=docker`

Then reinstall the latest service unit and reload `systemd`:
```bash
sudo install -m 644 systemd/db-backup.service /etc/systemd/system/db-backup.service
sudo systemctl daemon-reload
```
