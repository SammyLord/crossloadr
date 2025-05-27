# Getting Started with Crossloadr

This guide will help you get up and running with Crossloadr, whether you're a developer submitting an app, an administrator managing the store, or a user installing apps.

## Installation

### Prerequisites

- Node.js 18.x or later
- SQLite 3.x
- Git
- Modern web browser
- For iOS Web Clips: iOS 14.0 or later

### Server Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/crossloadr.git
   cd crossloadr
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies (backend and frontend)
   npm run install:all
   ```

3. **Configure Environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Initialize Database**
   ```bash
   # Create data directory
   mkdir -p data
   
   # Initialize database
   node src/scripts/init-db.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The application should now be running at `http://localhost:3000`

## User Guide

### Installing Apps

1. **Browse the Store**
   - Visit the app store at `/store`
   - Use filters to find apps
   - Click on an app to view details

2. **Install an App**
   - Click "Install" on the app card
   - Review security status
   - Download the profile
   - Open the profile on your iOS device
   - Follow the installation prompts

3. **Manage Installed Apps**
   - Access your profile at `/profile`
   - View installed apps
   - Remove apps as needed

### For Developers

1. **Create an Account**
   - Register at `/register`
   - Verify your email
   - Complete developer profile

2. **Submit an App**
   - Navigate to `/submit`
   - Fill out app details
   - Upload app icon
   - Submit for review

3. **Track Submission**
   - View status at `/developer/dashboard`
   - Respond to review requests
   - Update app information

### For Administrators

1. **Access Admin Dashboard**
   - Log in with admin credentials
   - Navigate to `/admin`
   - Review pending submissions
   - Manage app store

2. **Review Apps**
   - Check security scan results
   - Review app content
   - Approve or reject submissions
   - Provide feedback

3. **Manage Store**
   - Update categories
   - Monitor performance
   - Handle user reports
   - Generate reports

## Security Features

### App Security

1. **Security Scans**
   - Automatic scanning on submission
   - Regular rescanning
   - Vulnerability detection
   - SSL verification

2. **Web Clip Security**
   - Secure profile generation
   - Content security policies
   - XSS protection
   - Data privacy checks

### User Security

1. **Authentication**
   - Secure login system
   - Role-based access
   - Session management
   - Password policies

2. **Data Protection**
   - Encrypted storage
   - Secure communications
   - Privacy controls
   - Data backup

## Development

### Local Development

1. **Frontend Development**
   ```bash
   # Start frontend development server
   cd frontend
   npm run dev
   ```

2. **Backend Development**
   ```bash
   # Start backend server with nodemon
   npm run dev:server
   ```

3. **Testing**
   ```bash
   # Run tests
   npm test
   
   # Run specific test suite
   npm test -- --grep "auth"
   ```

### API Development

1. **API Documentation**
   - View API docs at `/api/docs`
   - Test endpoints at `/api/test`
   - Review schemas at `/api/schemas`

2. **API Testing**
   ```bash
   # Test API endpoints
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
        http://localhost:3000/api/health
   ```

## Troubleshooting

### Common Issues

1. **Installation Problems**
   - Check Node.js version
   - Verify SQLite installation
   - Check file permissions
   - Review error logs

2. **App Installation**
   - Verify iOS version
   - Check internet connection
   - Clear browser cache
   - Try alternative browser

3. **Development Issues**
   - Check console logs
   - Verify environment variables
   - Clear node_modules and reinstall
   - Check port availability

### Getting Help

1. **Documentation**
   - Review [Server Management](./server-management.md)
   - Check [App Store Management](./app-store-management.md)
   - Read [Security Guide](./security.md)
   - View [API Reference](./api-reference.md)

2. **Support**
   - Check [Troubleshooting Guide](./troubleshooting.md)
   - Submit GitHub issues
   - Contact support team
   - Join community forum

## Next Steps

1. **For Users**
   - Browse the app store
   - Install your first app
   - Set up your profile
   - Review security settings

2. **For Developers**
   - Review submission guidelines
   - Prepare your app
   - Submit for review
   - Monitor performance

3. **For Administrators**
   - Set up monitoring
   - Configure backups
   - Review security settings
   - Plan maintenance schedule 