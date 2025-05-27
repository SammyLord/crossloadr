import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import schedule from 'node-schedule';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupDatabase } from './config/database.js';
import logger from './config/logger.js';
import appRoutes from './routes/apps.js';
import developerRoutes from './routes/developer.js';
import adminRoutes from './routes/admin.js';
import { setupScanner } from './services/scanner.js';
import { setupProfileGenerator } from './services/profileGenerator.js';
import { scanAllApps } from './services/scanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.set('trust proxy', 1); // Trust first proxy (needed for correct client IP with rate limiting)
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static files
app.use(express.static(join(__dirname, '../frontend/dist')));

// API routes
app.use('/api/apps', appRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/developer', developerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize services
async function initializeServices() {
    try {
        // Initialize database
        await setupDatabase();
        logger.info('Database initialized');

        // Initialize scanner
        await setupScanner();
        logger.info('Security scanner initialized');

        // Initialize profile generator
        await setupProfileGenerator();
        logger.info('Profile generator initialized');

        // Schedule regular security scans
        const scanInterval = process.env.SCAN_INTERVAL_DAYS || 120;
        schedule.scheduleJob(`0 0 */${scanInterval} * *`, async () => {
            logger.info('Starting scheduled security scan of all apps');
            try {
                await scanAllApps();
                logger.info('Scheduled security scan completed successfully');
            } catch (error) {
                logger.error('Scheduled security scan failed:', error);
            }
        });

        // Start server
        app.listen(port, () => {
            logger.info(`Server running on port ${port}`);
        });
    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

// Start the server
initializeServices(); 