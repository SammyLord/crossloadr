import axios from 'axios';
import { dbHelpers } from '../config/database.js';
import logger from '../config/logger.js';

// Security check types
const SECURITY_CHECKS = {
    SSL: 'ssl',
    MALWARE: 'malware',
    PHISHING: 'phishing',
    VULNERABILITIES: 'vulnerabilities',
    CONTENT_SECURITY: 'content_security'
};

// Perform security scan on a single app
async function scanApp(app) {
    const scanResult = {
        appId: app.id,
        timestamp: Date.now(),
        checks: {},
        status: 'pending',
        issues: [],
        details: {
            ssl: false,
            contentSecurity: false,
            xss: false,
            dataPrivacy: false
        }
    };

    try {
        // Check SSL/TLS
        const sslCheck = await checkSSL(app.url);
        scanResult.checks[SECURITY_CHECKS.SSL] = sslCheck;
        if (!sslCheck.valid) {
            scanResult.issues.push({
                type: SECURITY_CHECKS.SSL,
                severity: 'high',
                message: 'SSL/TLS certificate is invalid or missing'
            });
        } else {
            scanResult.details.ssl = true;
        }

        // Check for malware
        const malwareCheck = await checkMalware(app.url);
        scanResult.checks[SECURITY_CHECKS.MALWARE] = malwareCheck;
        if (malwareCheck.detected) {
            scanResult.issues.push({
                type: SECURITY_CHECKS.MALWARE,
                severity: 'critical',
                message: 'Malware detected'
            });
        }

        // Check for phishing
        const phishingCheck = await checkPhishing(app.url);
        scanResult.checks[SECURITY_CHECKS.PHISHING] = phishingCheck;
        if (phishingCheck.detected) {
            scanResult.issues.push({
                type: SECURITY_CHECKS.PHISHING,
                severity: 'critical',
                message: 'Phishing indicators detected'
            });
        }

        // Check for common vulnerabilities
        const vulnCheck = await checkVulnerabilities(app.url);
        scanResult.checks[SECURITY_CHECKS.VULNERABILITIES] = vulnCheck;
        if (vulnCheck.vulnerabilities.length > 0) {
            scanResult.issues.push({
                type: SECURITY_CHECKS.VULNERABILITIES,
                severity: 'high',
                message: `Found ${vulnCheck.vulnerabilities.length} security vulnerabilities`
            });
        }

        // Check Content Security Policy
        const cspCheck = await checkContentSecurity(app.url);
        scanResult.checks[SECURITY_CHECKS.CONTENT_SECURITY] = cspCheck;
        if (!cspCheck.valid) {
            scanResult.issues.push({
                type: SECURITY_CHECKS.CONTENT_SECURITY,
                severity: 'medium',
                message: 'Missing or weak Content Security Policy'
            });
        } else {
            scanResult.details.contentSecurity = true;
        }

        // Placeholder for XSS and dataPrivacy checks - you can update these later
        // For now, we'll assume they pass or you'll implement actual checks
        scanResult.details.xss = true;
        scanResult.details.dataPrivacy = true;

        // Update scan status
        scanResult.status = scanResult.issues.length === 0 ? 'passed' : 'failed';

        // Save scan result
        await dbHelpers.addScanResult(scanResult);

        // -- REMOVED AUTOMATIC APP STATUS UPDATE BASED ON SCAN RESULT --
        // The app should remain 'pending' after initial scan until an admin reviews it.
        // The app's lastScan and scanIssues will be updated by the calling function if necessary,
        // or when an admin approves/rejects.

        // For now, let's ensure the app's lastScan and scanIssues are updated after the initial scan.
        // The calling function in routes/apps.js can handle this.
        await dbHelpers.updateApp(app.id, {
            lastScan: scanResult.timestamp,
            scanIssues: scanResult.issues
            // DO NOT change app.status here
        });

        return scanResult;
    } catch (error) {
        logger.error(`Scan failed for app ${app.id}:`, error);
        scanResult.status = 'error';
        scanResult.error = error.message;
        await dbHelpers.addScanResult(scanResult);
        throw error;
    }
}

// Scan all apps in the database
export async function scanAllApps() {
    const apps = await dbHelpers.getAllApps();
    const results = [];

    for (const app of apps) {
        try {
            const result = await scanApp(app);
            results.push(result);
        } catch (error) {
            logger.error(`Failed to scan app ${app.id}:`, error);
            results.push({
                appId: app.id,
                status: 'error',
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    return results;
}

// Individual security check implementations
async function checkSSL(url) {
    try {
        const response = await axios.get(url, {
            validateStatus: () => true,
            maxRedirects: 5
        });
        return {
            valid: response.request.res.socket.encrypted,
            protocol: response.request.res.socket.getProtocol(),
            timestamp: Date.now()
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message,
            timestamp: Date.now()
        };
    }
}

async function checkMalware(url) {
    // Implement malware scanning logic here
    // This is a placeholder that would typically integrate with a malware scanning service
    return {
        detected: false,
        timestamp: Date.now()
    };
}

async function checkPhishing(url) {
    // Implement phishing detection logic here
    // This is a placeholder that would typically integrate with a phishing detection service
    return {
        detected: false,
        timestamp: Date.now()
    };
}

async function checkVulnerabilities(url) {
    // Implement vulnerability scanning logic here
    // This is a placeholder that would typically integrate with a vulnerability scanning service
    return {
        vulnerabilities: [],
        timestamp: Date.now()
    };
}

async function checkContentSecurity(url) {
    try {
        const response = await axios.get(url);
        const cspHeader = response.headers['content-security-policy'];
        return {
            valid: !!cspHeader,
            policy: cspHeader,
            timestamp: Date.now()
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message,
            timestamp: Date.now()
        };
    }
}

export { scanApp, SECURITY_CHECKS };

// Initialize the scanner service
export async function setupScanner() {
    try {
        // Verify database connection
        await dbHelpers.testConnection();
        logger.info('Scanner service initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize scanner service:', error);
        throw error;
    }
} 