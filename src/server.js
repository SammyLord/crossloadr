import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import schedule from 'node-schedule';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupDatabase } from './config/database.js';
import { setupLogger } from './config/logger.js';
import { scanAllApps } from './services/scanner.js';
import appRoutes from './routes/apps.js';
import developerRoutes from './routes/developer.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize logger
const logger = setupLogger();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static files
app.use(express.static(join(__dirname, '../public')));

// API routes
app.use('/api/apps', appRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize database
setupDatabase();

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
}); 