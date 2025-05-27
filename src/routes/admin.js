import express from 'express';
import { param, validationResult } from 'express-validator';
import { dbHelpers } from '../config/database.js';
import { scanApp } from '../services/scanner.js';
import { generateProfile, deleteProfile } from '../services/profileGenerator.js';
import logger from '../config/logger.js';

const router = express.Router();

// Admin authentication middleware (placeholder - implement proper auth)
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN_STRING"

    if (!token || token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get all apps (including pending and suspended)
router.get('/apps', async (req, res) => {
    try {
        const allApps = await dbHelpers.getAllApps();
        const appsWithScanResults = await Promise.all(
            allApps.map(async (app) => {
                const latestScan = await dbHelpers.getLatestScanForApp(app.id);
                return {
                    ...app,
                    scanResult: latestScan || null // Ensure scanResult is null if no scan found, not undefined
                };
            })
        );
        res.json(appsWithScanResults);
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

        let app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        if (app.status !== 'pending') {
            return res.status(400).json({ error: 'App is not in pending state and cannot be approved.' });
        }

        // App is pending, proceed to make it active
        const updatedApp = await dbHelpers.updateApp(req.params.id, {
            status: 'active',
            approvedAt: Date.now(),
            // lastScan and scanIssues are already set from the initial scan
            // or can be updated via a separate rescan action.
        });

        if (!updatedApp) {
            // Should not happen if getAppById found it, but as a safeguard
            return res.status(500).json({ error: 'Failed to update app during approval' });
        }

        // Generate profile for the now active app
        // Ensure generateProfile uses the latest app data, especially if it needs icon/url
        await generateProfile(updatedApp);

        res.json(updatedApp);

    } catch (error) {
        logger.error(`Failed to approve app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to approve app' });
    }
});

// Suspend app
router.post('/apps/:id/suspend', authenticateAdmin, param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        // Only active apps can be suspended by this action for now
        // (though one might want to suspend a pending app to prevent approval)
        if (app.status !== 'active') {
            return res.status(400).json({ error: `App is not in 'active' state (current: ${app.status}), cannot suspend.` });
        }

        const updatedApp = await dbHelpers.updateApp(req.params.id, {
            status: 'suspended',
            suspendedAt: Date.now(),
            // Clear approval timestamp if it was previously active
            approvedAt: null 
        });

        if (!updatedApp) {
            return res.status(500).json({ error: 'Failed to update app during suspension' });
        }

        // Optionally, consider if a profile for a suspended app should be handled (e.g., deleted or marked)
        // For now, profile remains, but won't be served if app is not 'active' by the public route.

        logger.info(`App ${updatedApp.id} has been suspended.`);
        res.json(updatedApp);

    } catch (error) {
        logger.error(`Failed to suspend app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to suspend app' });
    }
});

// Reactivate a suspended app
router.post('/apps/:id/reactivate', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        if (app.status !== 'suspended') {
            return res.status(400).json({ error: `App is not in 'suspended' state (current: ${app.status}), cannot reactivate.` });
        }

        const updates = {
            status: 'active',
            // Using approvedAt for simplicity, as it signifies it's now active.
            // Alternatively, a new field like reactivatedAt could be used.
            approvedAt: Date.now(), 
            suspendedAt: null,
            rejectionReason: null // Clear any previous rejection reason if it was rejected before suspension
        };

        const updatedApp = await dbHelpers.updateApp(req.params.id, updates);

        if (!updatedApp) {
            return res.status(500).json({ error: 'Failed to update app during reactivation' });
        }

        // Re-generate profile for the now active app
        try {
            await generateProfile(updatedApp);
            logger.info(`Profile regenerated for reactivated app ${updatedApp.id}`);
        } catch (profileError) {
            logger.error(`Failed to regenerate profile for reactivated app ${updatedApp.id}:`, profileError);
            // Decide if this should be a fatal error for reactivation. 
            // For now, log it and continue, the app is reactivated in DB.
        }

        logger.info(`App ${updatedApp.id} has been reactivated.`);
        res.json(updatedApp);

    } catch (error) {
        logger.error(`Failed to reactivate app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to reactivate app' });
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