import express from 'express';
import { param, validationResult } from 'express-validator';
import { dbHelpers } from '../config/database.js';
import { scanApp } from '../services/scanner.js';
import { generateProfile, deleteProfile } from '../services/profileGenerator.js';
import logger from '../config/logger.js';

const router = express.Router();

// Admin authentication middleware (placeholder - implement proper auth)
const authenticateAdmin = (req, res, next) => {
    const adminToken = req.headers['x-admin-token'];
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get all apps (including pending and suspended)
router.get('/apps', async (req, res) => {
    try {
        const apps = await dbHelpers.getAllApps();
        res.json(apps);
    } catch (error) {
        logger.error('Failed to get all apps:', error);
        res.status(500).json({ error: 'Failed to fetch apps' });
    }
});

// Get app details (admin view)
router.get('/apps/:id', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        // Get latest scan result
        const latestScan = await dbHelpers.getLatestScanForApp(app.id);
        res.json({
            ...app,
            latestScan
        });
    } catch (error) {
        logger.error(`Failed to get app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch app details' });
    }
});

// Approve app
router.post('/apps/:id/approve', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        // Perform security scan
        const scanResult = await scanApp(app);

        if (scanResult.status === 'passed') {
            // Update app status
            const updatedApp = await dbHelpers.updateApp(req.params.id, {
                status: 'active',
                approvedAt: Date.now(),
                lastScan: scanResult.timestamp,
                scanIssues: []
            });

            // Generate profile
            await generateProfile(updatedApp);

            res.json(updatedApp);
        } else {
            res.status(400).json({
                error: 'App failed security scan',
                scanResult
            });
        }
    } catch (error) {
        logger.error(`Failed to approve app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to approve app' });
    }
});

// Reject app
router.post('/apps/:id/reject', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        const updatedApp = await dbHelpers.updateApp(req.params.id, {
            status: 'rejected',
            rejectedAt: Date.now(),
            rejectionReason: req.body.reason
        });

        res.json(updatedApp);
    } catch (error) {
        logger.error(`Failed to reject app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to reject app' });
    }
});

// Remove app
router.delete('/apps/:id', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        // Delete app and its profile
        await Promise.all([
            dbHelpers.deleteApp(req.params.id),
            deleteProfile(req.params.id)
        ]);

        res.status(204).send();
    } catch (error) {
        logger.error(`Failed to remove app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to remove app' });
    }
});

// Force rescan of app
router.post('/apps/:id/scan', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        const scanResult = await scanApp(app);
        res.json(scanResult);
    } catch (error) {
        logger.error(`Failed to scan app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to scan app' });
    }
});

export default router; 