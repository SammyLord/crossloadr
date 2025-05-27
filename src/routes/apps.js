import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import plist from 'plist'; // Import the plist library
import { dbHelpers } from '../config/database.js';
import { scanApp } from '../services/scanner.js';
import { generateProfile, getProfile } from '../services/profileGenerator.js';
import logger from '../config/logger.js';

const router = express.Router();

// Validation middleware
const validateAppSubmission = [
    body('name').trim().notEmpty().withMessage('App name is required'),
    body('url').isURL().withMessage('Valid URL is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('developerName').trim().notEmpty().withMessage('Developer name is required'),
    body('developerEmail').isEmail().withMessage('Valid developer email is required'),
    body('icon').trim().notEmpty().withMessage('App icon is required')
];

// Get all approved apps
router.get('/', async (req, res) => {
    try {
        const allApps = await dbHelpers.getAllApps();
        const activeApps = allApps.filter(app => app.status === 'active');

        const appsWithScanResults = await Promise.all(
            activeApps.map(async (app) => {
                const latestScan = await dbHelpers.getLatestScanForApp(app.id);
                return {
                    ...app,
                    scanResult: latestScan || null // Ensure scanResult is null if no scan found
                };
            })
        );
        res.json(appsWithScanResults);
    } catch (error) {
        logger.error('Failed to get apps:', error);
        res.status(500).json({ error: 'Failed to fetch apps' });
    }
});

// Get app details
router.get('/:id', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        if (app.status !== 'active') {
            return res.status(403).json({ error: 'App is not available' });
        }

        const latestScan = await dbHelpers.getLatestScanForApp(app.id);
        res.json({
            ...app,
            scanResult: latestScan || null // Add scanResult here
        });
    } catch (error) {
        logger.error(`Failed to get app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch app details' });
    }
});

// Submit new app
router.post('/', validateAppSubmission, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        logger.info('[POST /api/apps] Received submission data:', req.body);
        const { developerName, developerEmail, ...otherAppData } = req.body;

        const app = {
            id: uuidv4(),
            ...otherAppData,
            developer: {
                name: developerName,
                email: developerEmail
            },
            developerEmail: developerEmail,
            status: 'pending',
            submittedAt: Date.now(),
            lastScan: null,
            scanIssues: []
        };

        logger.info('[POST /api/apps] App object before addApp:', JSON.stringify(app));

        // Save app
        const savedApp = await dbHelpers.addApp(app);
        logger.info('[POST /api/apps] App object after addApp (from dbHelpers):', JSON.stringify(savedApp));

        // Perform initial security scan
        logger.info(`[POST /api/apps] App status before scanApp: ${savedApp.status}`);
        const scanResult = await scanApp(savedApp);
        logger.info(`[POST /api/apps] App status after scanApp (scanResult status: ${scanResult?.status}): ${savedApp.status}`);

        // If scan passes, generate profile
        if (scanResult.status === 'passed') {
            logger.info(`[POST /api/apps] App status before generateProfile: ${savedApp.status}`);
            await generateProfile(savedApp);
            logger.info(`[POST /api/apps] App status after generateProfile: ${savedApp.status}`);
        }
        
        res.status(201).json(savedApp);
    } catch (error) {
        logger.error('[POST /api/apps] Failed to submit app:', error);
        res.status(500).json({ error: 'Failed to submit app' });
    }
});

// Download iOS web clip profile
router.get('/:id/profile', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app || app.status !== 'active') {
            return res.status(404).json({ error: 'App not found or not available' });
        }

        // Always generate the profile on-the-fly for easier testing
        logger.info(`[${req.method} ${req.originalUrl}] Force generating profile for app ${app.id} for testing.`);
        let profile;
        try {
            profile = await generateProfile(app); // generateProfile creates and saves to DB
            logger.info(`[${req.method} ${req.originalUrl}] Successfully generated profile on-the-fly for app ${app.id}.`);
        } catch (generationError) {
            logger.error(`[${req.method} ${req.originalUrl}] Failed to generate profile on-the-fly for app ${app.id}:`, generationError);
            return res.status(500).json({ error: 'Failed to generate profile on-the-fly' });
        }
        
        // The rest of the code remains the same, using the `profile` object from generateProfile
        if (!profile || !profile.payload) { 
            logger.error(`[${req.method} ${req.originalUrl}] Profile or payload is missing after on-the-fly generation for app ${app.id}.`);
            return res.status(500).json({ error: 'Failed to get or generate profile payload' });
        }
        
        res.setHeader('Content-Type', 'application/x-apple-aspen-config');
        res.setHeader('Content-Disposition', `attachment; filename="${app.name}.mobileconfig"`);
        const xmlPayload = plist.build(profile.payload);
        res.send(xmlPayload);
    } catch (error) {
        logger.error(`[${req.method} ${req.originalUrl}] General error in profile route for app ${req.params.id}:`, error);
        if (res.headersSent) {
            return res.end();
        }
        res.status(500).json({ error: 'Failed to process profile request' });
    }
});

export default router; 