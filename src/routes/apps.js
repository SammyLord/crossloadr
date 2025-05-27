import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
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
    body('developer').trim().notEmpty().withMessage('Developer name is required'),
    body('icon').trim().notEmpty().withMessage('App icon is required')
];

// Get all approved apps
router.get('/', async (req, res) => {
    try {
        const apps = await dbHelpers.getAllApps();
        const approvedApps = apps.filter(app => app.status === 'active');
        res.json(approvedApps);
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

        res.json(app);
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

        const app = {
            id: uuidv4(),
            ...req.body,
            status: 'pending',
            submittedAt: Date.now(),
            lastScan: null,
            scanIssues: []
        };

        // Save app
        await dbHelpers.addApp(app);

        // Perform initial security scan
        const scanResult = await scanApp(app);

        // If scan passes, generate profile
        if (scanResult.status === 'passed') {
            await generateProfile(app);
        }

        res.status(201).json(app);
    } catch (error) {
        logger.error('Failed to submit app:', error);
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

        const profile = await getProfile(app.id);
        
        res.setHeader('Content-Type', 'application/x-apple-aspen-config');
        res.setHeader('Content-Disposition', `attachment; filename="${app.name}.mobileconfig"`);
        res.json(profile.payload);
    } catch (error) {
        logger.error(`Failed to get profile for app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to generate profile' });
    }
});

export default router; 