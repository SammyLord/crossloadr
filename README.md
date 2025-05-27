# CrossLoadr - Secure Web App Store

A modern web app store that provides iOS web clip profiles for web applications. The platform automatically scans submitted web apps for security vulnerabilities and maintains a safe environment for users.

## Features

- Web app submission and management
- Automatic security scanning
- iOS web clip profile generation
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
- `GET /api/apps` - List all approved web apps
- `GET /api/apps/:id` - Get details of a specific web app
- `GET /api/apps/:id/profile` - Download iOS web clip profile

### Developer Endpoints
- `POST /api/apps` - Submit a new web app
- `GET /api/developer/apps` - List developer's submitted apps
- `PUT /api/apps/:id` - Update web app details

### Admin Endpoints
- `GET /api/admin/apps` - List all web apps (including pending)
- `POST /api/admin/apps/:id/approve` - Approve a web app
- `DELETE /api/admin/apps/:id` - Remove a web app

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 