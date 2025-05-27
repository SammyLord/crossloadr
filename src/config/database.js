import { QuickDB } from 'quick.db';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const db = new QuickDB({
    filePath: join(__dirname, '../../data/database.sqlite')
});

// Database tables
const tables = {
    apps: 'apps',
    developers: 'developers',
    scans: 'scans',
    profiles: 'profiles'
};

// Initialize database tables with default values
export async function setupDatabase() {
    try {
        // Apps table
        if (!await db.has(tables.apps)) {
            await db.set(tables.apps, []);
        }

        // Developers table
        if (!await db.has(tables.developers)) {
            await db.set(tables.developers, []);
        }

        // Scans table
        if (!await db.has(tables.scans)) {
            await db.set(tables.scans, []);
        }

        // Profiles table
        if (!await db.has(tables.profiles)) {
            await db.set(tables.profiles, []);
        }

        logger.info('Database initialized successfully');
    } catch (error) {
        logger.error('Database initialization failed:', error);
        throw error;
    }
}

// Helper functions for database operations
export const dbHelpers = {
    // Apps
    async getAllApps() {
        return await db.get(tables.apps) || [];
    },

    async getAppById(id) {
        const apps = await db.get(tables.apps) || [];
        return apps.find(app => app.id === id);
    },

    async getAppsByDeveloperEmail(email) {
        const allApps = await db.get(tables.apps) || [];
        return allApps.filter(app => app.developerEmail === email);
    },

    async addApp(app) {
        const apps = await db.get(tables.apps) || [];
        apps.push(app);
        await db.set(tables.apps, apps);
        return app;
    },

    async updateApp(id, updates) {
        const apps = await db.get(tables.apps) || [];
        const index = apps.findIndex(app => app.id === id);
        if (index !== -1) {
            apps[index] = { ...apps[index], ...updates };
            await db.set(tables.apps, apps);
            return apps[index];
        }
        return null;
    },

    async deleteApp(id) {
        const apps = await db.get(tables.apps) || [];
        const filteredApps = apps.filter(app => app.id !== id);
        await db.set(tables.apps, filteredApps);
    },

    // Developers
    async getDeveloperByEmail(email) {
        const developers = await db.get(tables.developers) || [];
        return developers.find(dev => dev.email === email);
    },

    async addDeveloper(developer) {
        const developers = await db.get(tables.developers) || [];
        developers.push(developer);
        await db.set(tables.developers, developers);
        return developer;
    },

    // Scans
    async addScanResult(scan) {
        const scans = await db.get(tables.scans) || [];
        scans.push(scan);
        await db.set(tables.scans, scans);
        return scan;
    },

    async getLatestScanForApp(appId) {
        const scans = await db.get(tables.scans) || [];
        return scans
            .filter(scan => scan.appId === appId)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
    },

    // Profiles
    async addProfile(profile) {
        const profiles = await db.get(tables.profiles) || [];
        profiles.push(profile);
        await db.set(tables.profiles, profiles);
        return profile;
    },

    async getProfileByAppId(appId) {
        const profiles = await db.get(tables.profiles) || [];
        return profiles.find(profile => profile.appId === appId);
    },

    async deleteProfile(appId) {
        const profiles = await db.get(tables.profiles) || [];
        const filteredProfiles = profiles.filter(profile => profile.appId !== appId);
        if (profiles.length === filteredProfiles.length) {
            logger.warn(`[dbHelpers.deleteProfile] No profile found to delete for appId: ${appId}`);
        }
        await db.set(tables.profiles, filteredProfiles);
        logger.info(`[dbHelpers.deleteProfile] Profiles table updated after attempting to delete profile for appId: ${appId}`);
    },

    // Test database connection
    async testConnection() {
        try {
            await db.get(tables.apps);
            return true;
        } catch (error) {
            throw new Error('Database connection failed: ' + error.message);
        }
    }
};

export default db; 