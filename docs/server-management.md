# Server Management

This guide covers how to run and maintain the Crossloadr server in both development and production environments.

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```env
# Server Configuration
PORT=3000                    # Port to run the server on
NODE_ENV=development         # Environment mode (development/production)

# Security
ADMIN_TOKEN=your-secure-token  # Secret token for admin authentication
SCAN_INTERVAL_DAYS=120        # Interval for security scans

# Database
DB_PATH=./data/crossloadr.db  # Path to SQLite database file

# Logging
LOG_LEVEL=info               # Winston logger level
LOG_MAX_SIZE=5242880        # Maximum size of log files (5MB)
LOG_MAX_FILES=5             # Maximum number of log files to keep
```

## Running the Server

### Development Mode

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   This will start both the backend server and frontend development server with hot reloading.

### Production Mode

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Set environment to production:
   ```bash
   export NODE_ENV=production
   ```

3. Start the server:
   ```bash
   node src/server.js
   ```

For production deployment, we recommend using a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start the server with PM2
pm2 start src/server.js --name crossloadr

# Other useful PM2 commands
pm2 status              # Check server status
pm2 logs crossloadr     # View logs
pm2 restart crossloadr  # Restart server
pm2 stop crossloadr     # Stop server
```

## Database Management

### Backup

The database is stored in SQLite format. Regular backups are recommended:

```bash
# Create a backup
sqlite3 ./data/crossloadr.db ".backup './backups/crossloadr-$(date +%Y%m%d).db'"

# Restore from backup
sqlite3 ./data/crossloadr.db ".restore './backups/crossloadr-20240101.db'"
```

### Maintenance

1. Regular vacuum to optimize database:
   ```bash
   sqlite3 ./data/crossloadr.db "VACUUM;"
   ```

2. Check database integrity:
   ```bash
   sqlite3 ./data/crossloadr.db "PRAGMA integrity_check;"
   ```

## Logging

Logs are stored in the `logs` directory with the following structure:
- `error.log` - Error level logs
- `combined.log` - All logs
- `access.log` - HTTP access logs

### Log Rotation

Logs are automatically rotated based on size and number of files as configured in the environment variables.

To manually rotate logs:
```bash
# Using logrotate (if installed)
logrotate -f /etc/logrotate.d/crossloadr

# Or manually
mv logs/combined.log logs/combined-$(date +%Y%m%d).log
touch logs/combined.log
```

## Security Maintenance

### Regular Tasks

1. Update dependencies:
   ```bash
   npm audit
   npm update
   ```

2. Rotate admin token:
   - Generate new token
   - Update in `.env`
   - Update in any CI/CD systems
   - Notify team members

3. Review security scan results:
   - Check `/admin/apps` for failed scans
   - Investigate and address vulnerabilities
   - Update security policies if needed

### API Details & Behavior Notes

This section details important API behaviors and recent changes. For a full API reference, see [API Reference](./api-reference.md).

**Admin Authentication:**
- All admin routes under `/api/admin/*` now require a Bearer token in the `Authorization` header (e.g., `Authorization: Bearer <YOUR_ADMIN_TOKEN>`). The previous `x-admin-token` header is deprecated.

**Key API Endpoint Changes & Additions:**

- **`GET /api/admin/apps` (List all apps for admin):**
  - The response for each app object now includes a `scanResult` field (contains latest scan info like `{ status: 'pass' | 'fail', details: {...} }` or `null`).

- **`POST /api/admin/apps/:id/approve` (Approve an app):**
  - This endpoint no longer re-scans the app upon approval. It primarily changes status to 'active' and generates the mobileconfig.

- **`GET /api/apps` (List active apps for public store):**
  - Each app object in the response now includes a `scanResult` field.

- **`GET /api/apps/:id` (Get public app details):**
  - The app object response includes `scanResult`, which may contain a `details` field (e.g., `scanResult.details`).

- **`GET /api/apps/:id/profile` (Download mobileconfig profile):**
  - **Always on-the-fly generation:** This endpoint now *always* generates the `.mobileconfig` profile when requested for an active app, ensuring the latest app configuration.
  - **Stricter icon fetching:** If an `app.icon` URL is provided, fetching/processing this icon is critical. Failures (timeout, non-existent image) will error out profile generation.

- **NEW: `POST /api/admin/apps/:id/suspend` (Suspend an app):**
  - **Action:** Changes app status to 'suspended'. Sets `suspendedAt`, clears `approvedAt`.
  - **Auth:** Admin Bearer Token required.

- **NEW: `POST /api/admin/apps/:id/reactivate` (Reactivate a suspended app):**
  - **Action:** Changes status from 'suspended' to 'active'. Sets `approvedAt`, clears `suspendedAt`, and `rejectionReason`. **Re-generates the mobileconfig profile.**
  - **Auth:** Admin Bearer Token required.

**Backend System Notes:**

- **App Scanning (`src/services/scanner.js`):**
  - Initial app scan (on submission) leaves app status as 'pending'. Status changes are via explicit admin actions.
  - `scanApp` service attempts to add a `details` object to `scanResult`.

- **Profile Generation (`src/services/profileGenerator.js`):**
  - Corrected `PrecomposedIcon` key in `.mobileconfig` payload.
  - Icon data passed as raw `Buffer` to `plist` library.
  - `IgnoreManifestScope: true` included for better PWA fullscreen behavior.
  - Stricter icon fetching with timeout.

- **Database (`src/config/database.js`):**
  - `deleteProfile` method added for complete app/profile removal. (This is used by the `DELETE /api/admin/apps/:id` endpoint).

### Monitoring

1. Server health:
   ```bash
   # Check server status
   curl http://localhost:3000/api/health

   # Monitor logs for errors
   tail -f logs/error.log
   ```

2. Resource usage:
   ```bash
   # Using PM2
   pm2 monit

   # Or system tools
   top
   htop
   ```

## Troubleshooting

### Common Issues

1. Server won't start:
   - Check if port is in use: `lsof -i :3000`
   - Verify environment variables
   - Check logs for errors

2. Database issues:
   - Verify database file permissions
   - Check disk space
   - Run integrity check

3. High resource usage:
   - Check for memory leaks
   - Review active connections
   - Monitor database size

### Recovery Procedures

1. Server crash:
   ```bash
   # Check logs
   tail -f logs/error.log

   # Restart with PM2
   pm2 restart crossloadr
   ```

2. Database corruption:
   ```bash
   # Stop server
   pm2 stop crossloadr

   # Restore from backup
   sqlite3 ./data/crossloadr.db ".restore './backups/latest-backup.db'"

   # Verify integrity
   sqlite3 ./data/crossloadr.db "PRAGMA integrity_check;"

   # Restart server
   pm2 start crossloadr
   ```

## Performance Optimization

1. Database indexes:
   - Monitor query performance
   - Add indexes for frequently queried fields
   - Regular VACUUM operations

2. Caching:
   - Enable Redis caching for frequently accessed data
   - Configure appropriate TTL values
   - Monitor cache hit rates

3. Resource limits:
   - Set appropriate Node.js memory limits
   - Configure connection pool sizes
   - Monitor and adjust based on usage patterns

## Backup and Recovery

### Automated Backups

Set up a cron job for regular backups:

```bash
# Add to crontab
0 2 * * * /path/to/crossloadr/scripts/backup.sh
```

### Backup Script Example

Create `scripts/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="./backups"
DB_PATH="./data/crossloadr.db"
DATE=$(date +%Y%m%d)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/crossloadr-$DATE.db'"

# Compress backup
gzip "$BACKUP_DIR/crossloadr-$DATE.db"

# Remove backups older than 30 days
find $BACKUP_DIR -name "crossloadr-*.db.gz" -mtime +30 -delete
```

Make the script executable:
```bash
chmod +x scripts/backup.sh
``` 