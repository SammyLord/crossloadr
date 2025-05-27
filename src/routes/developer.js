import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../config/database.js';
import { scanApp } from '../services/scanner.js';
import { updateProfile } from '../services/profileGenerator.js';
import logger from '../config/logger.js';

const router = express.Router();

// Validation middleware
const validateDeveloper = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('website').optional().isURL().withMessage('Valid website URL is required')
];

// Register developer
router.post('/register', validateDeveloper, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if developer already exists
        const existingDev = await dbHelpers.getDeveloperByEmail(req.body.email);
        if (existingDev) {
            return res.status(409).json({ error: 'Developer already registered' });
        }

        const developer = {
            id: uuidv4(),
            ...req.body,
            registeredAt: Date.now(),
            status: 'active'
        };

        await dbHelpers.addDeveloper(developer);
        res.status(201).json(developer);
    } catch (error) {
        logger.error('Failed to register developer:', error);
        res.status(500).json({ error: 'Failed to register developer' });
    }
});

// Developer login
router.post(
    '/login',
    [body('email').isEmail().withMessage('Valid email is required')],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;
        try {
            const appsByDeveloper = await dbHelpers.getAppsByDeveloperEmail(email);
            // We don't need to send all app data, just confirm existence for login
            if (appsByDeveloper && appsByDeveloper.length > 0) {
                logger.info(`Developer login successful for email: ${email}`);
                // Could return developer details or a session token in a real app
                res.status(200).json({ message: 'Login successful', email: email }); 
            } else {
                logger.info(`No apps found for developer email during login attempt: ${email}`);
                // For now, we'll allow login even if no apps, to enable first-time app submission flow
                // The dashboard can then show "no apps yet".
                // Alternatively, to be stricter: return res.status(404).json({ error: 'No apps found for this email. Register by submitting an app.' });
                res.status(200).json({ message: 'Login successful (no apps found yet)', email: email });
            }
        } catch (error) {
            logger.error(`Developer login failed for ${email}:`, error);
            res.status(500).json({ error: 'Server error during login' });
        }
    }
);

// Get apps for a specific developer
router.get('/apps', async (req, res) => {
    const developerEmail = req.query.email;
    if (!developerEmail) {
        return res.status(400).json({ error: 'Developer email is required as a query parameter' });
    }

    try {
        const apps = await dbHelpers.getAppsByDeveloperEmail(developerEmail);
        
        // Similar to other app-listing endpoints, we should include scan results
        const appsWithScanResults = await Promise.all(
            apps.map(async (app) => {
                const latestScan = await dbHelpers.getLatestScanForApp(app.id);
                return {
                    ...app,
                    scanResult: latestScan || null,
                };
            })
        );

        res.json(appsWithScanResults);
    } catch (error) {
        logger.error(`Failed to get apps for developer ${developerEmail}:`, error);
        res.status(500).json({ error: 'Failed to fetch developer apps' });
    }
});

// Update app
router.put('/apps/:id', [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('icon').optional().trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Developer email is required' });
        }

        const developer = await dbHelpers.getDeveloperByEmail(email);
        if (!developer) {
            return res.status(404).json({ error: 'Developer not found' });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        if (app.developer !== developer.id) {
            return res.status(403).json({ error: 'Not authorized to update this app' });
        }

        // Update app
        const updatedApp = await dbHelpers.updateApp(req.params.id, {
            ...req.body,
            updatedAt: Date.now()
        });

        // If app is active, rescan and update profile
        if (updatedApp.status === 'active') {
            const scanResult = await scanApp(updatedApp);
            if (scanResult.status === 'passed') {
                await updateProfile(updatedApp.id, {
                    displayName: updatedApp.name,
                    icon: updatedApp.icon
                });
            }
        }

        res.json(updatedApp);
    } catch (error) {
        logger.error(`Failed to update app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update app' });
    }
});

// Delete app
router.delete('/apps/:id', param('id').isUUID(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Developer email is required' });
        }

        const developer = await dbHelpers.getDeveloperByEmail(email);
        if (!developer) {
            return res.status(404).json({ error: 'Developer not found' });
        }

        const app = await dbHelpers.getAppById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }

        if (app.developer !== developer.id) {
            return res.status(403).json({ error: 'Not authorized to delete this app' });
        }

        await dbHelpers.deleteApp(req.params.id);
        res.status(204).send();
    } catch (error) {
        logger.error(`Failed to delete app ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to delete app' });
    }
});

export default router; 