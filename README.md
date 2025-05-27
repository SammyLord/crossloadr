# CrossLoadr - Secure Web App Store

A modern web app store that provides iOS web clip profiles for web applications. The platform automatically scans submitted web apps for security vulnerabilities and maintains a safe environment for users.

## Features

- Web app submission and management
- Automatic security scanning
- iOS web clip profile generation (with improved PWA fullscreen experience via `IgnoreManifestScope: true`)
- App lifecycle management: Approve, Reject, Suspend, and Reactivate applications
- Regular vulnerability checks (every 120 days)
- Developer dashboard
- Modern, responsive UI

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crossloadr.git
cd crossloadr
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
NODE_ENV=development
SCAN_INTERVAL_DAYS=120
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Security Features

- Automatic vulnerability scanning of submitted web apps
- Regular security audits every 120 days
- Malicious activity detection
- Rate limiting and request validation
- Secure profile generation

## API Endpoints

### Public Endpoints
- `GET /api/apps` - List all approved web apps (response includes `scanResult`)
- `GET /api/apps/:id` - Get details of a specific web app (response includes `scanResult`)
- `GET /api/apps/:id/profile` - Download iOS web clip profile (always generated on-the-fly)

### Developer Endpoints
- `POST /api/apps` - Submit a new web app
- `GET /api/developer/apps` - List developer's submitted apps
- `PUT /api/apps/:id` - Update web app details

### Admin Endpoints
(Require `Authorization: Bearer <ADMIN_TOKEN>` header)
- `GET /api/admin/apps` - List all web apps, including pending (response includes `scanResult` for each app)
- `POST /api/admin/apps/:id/approve` - Approve a web app (does not re-scan; generates profile)
- `POST /api/admin/apps/:id/reject` - Reject a web app
- `POST /api/admin/apps/:id/suspend` - Suspend an active app (removes from public store)
- `POST /api/admin/apps/:id/reactivate` - Reactivate a suspended app (adds to public store, re-generates profile)
- `POST /api/admin/apps/:id/scan` - Trigger a rescan of an app
- `DELETE /api/admin/apps/:id` - Remove a web app and its profile

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 