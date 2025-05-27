import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { dbHelpers } from '../config/database.js';
import logger from '../config/logger.js';

// Generate iOS web clip profile for a web app
export async function generateProfile(app) {
    try {
        const profileId = uuidv4();
        const payload = await generateProfilePayload(app);
        if (!payload) {
            throw new Error('Failed to generate profile payload, possibly due to icon fetching issue.');
        }

        const profile = {
            id: profileId,
            appId: app.id,
            displayName: app.name,
            url: app.url,
            icon: app.icon,
            timestamp: Date.now(),
            payload: payload
        };

        // Save profile to database
        await dbHelpers.addProfile(profile);
        logger.info(`Generated profile for app ${app.id}`);

        return profile;
    } catch (error) {
        logger.error(`Failed to generate profile for app ${app.id}:`, error);
        throw error;
    }
}

// Generate the actual profile payload
async function generateProfilePayload(app) {
    let iconData = null;

    if (app.icon) {
        try {
            logger.info(`Fetching icon for profile generation: ${app.icon}`);
            const response = await axios.get(app.icon, { responseType: 'arraybuffer', timeout: 5000 });
            iconData = Buffer.from(response.data);
            const fetchedContentType = response.headers['content-type'];

            if (iconData.length === 0) {
                logger.warn(`Fetched icon for ${app.name} from ${app.icon} is empty (0 bytes).`);
                iconData = null;
            } else {
                logger.info(`Successfully fetched icon for ${app.name}. Content-Type: ${fetchedContentType}. Size: ${iconData.length} bytes`);
            }

        } catch (iconError) {
            logger.error(`Failed to fetch or encode icon from URL ${app.icon} for app ${app.id}:`, iconError);
            throw new Error(`Icon specified (${app.icon}) but could not be fetched/processed for app ${app.id}. Profile generation aborted.`);
        }
    }

    const payloadContent = {
        FullScreen: true,
        IsRemovable: true,
        Label: app.name,
        PayloadDescription: `Configures web clip for ${app.name}`,
        PayloadDisplayName: `${app.name} Web Clip`,
        PayloadIdentifier: `com.crossloadr.webclip.${app.id}.${uuidv4()}`,
        PayloadType: 'com.apple.webClip.managed',
        PayloadUUID: uuidv4(),
        PayloadVersion: 1,
        PrecomposedIcon: true,
        URL: app.url,
        IgnoreManifestScope: true
    };

    if (iconData) {
        payloadContent.Icon = iconData;
    }

    const payload = {
        PayloadContent: [payloadContent],
        PayloadDescription: `Web clip profile for ${app.name}`,
        PayloadDisplayName: `${app.name} Web Clip Profile`,
        PayloadIdentifier: `com.crossloadr.profile.${app.id}.${uuidv4()}`,
        PayloadOrganization: 'CrossLoadr',
        PayloadRemovalDisallowed: false,
        PayloadType: 'Configuration',
        PayloadUUID: uuidv4(),
        PayloadVersion: 1
    };

    return payload;
}

// Get profile for an app
export async function getProfile(appId) {
    try {
        const profile = await dbHelpers.getProfileByAppId(appId);
        if (!profile) {
            throw new Error(`No profile found for app ${appId}`);
        }
        return profile;
    } catch (error) {
        logger.error(`Failed to get profile for app ${appId}:`, error);
        throw error;
    }
}

// Update profile for an app
export async function updateProfile(appId, updates) {
    try {
        const appFromDb = await dbHelpers.getAppById(appId);
        if (!appFromDb) {
            throw new Error(`App ${appId} not found, cannot update profile.`);
        }

        const appDataForPayload = {
            id: appFromDb.id,
            name: updates.name || appFromDb.name,
            url: updates.url || appFromDb.url,
            icon: updates.icon || appFromDb.icon,
        };

        const newPayload = await generateProfilePayload(appDataForPayload);
        if (!newPayload) {
            throw new Error('Failed to generate updated profile payload.');
        }

        const profile = await dbHelpers.getProfileByAppId(appId);
        if (!profile) {
            logger.warn(`No existing profile found for app ${appId} during update. A new one might be created by addProfile if dbHelpers.updateProfile allows upsert.`);
        }

        const updatedProfileData = {
            ...(profile || {}),
            appId: appId,
            displayName: appDataForPayload.name,
            url: appDataForPayload.url,
            icon: appDataForPayload.icon,
            payload: newPayload,
            timestamp: Date.now(),
        };

        await dbHelpers.updateProfile(appId, updatedProfileData);
        logger.info(`Updated profile for app ${appId}`);

        return updatedProfileData;
    } catch (error) {
        logger.error(`Failed to update profile for app ${appId}:`, error);
        throw error;
    }
}

// Delete profile for an app
export async function deleteProfile(appId) {
    try {
        logger.info(`[profileGenerator.deleteProfile] Attempting to delete profile for appId: ${appId}`);
        await dbHelpers.deleteProfile(appId);
        logger.info(`[profileGenerator.deleteProfile] Successfully called dbHelpers.deleteProfile for appId: ${appId}`);
    } catch (error) {
        logger.error(`[profileGenerator.deleteProfile] Error during profile deletion for appId ${appId}:`, error);
        throw error; // Re-throw to be caught by the route handler
    }
}

// Initialize the profile generator service
export async function setupProfileGenerator() {
    try {
        // Verify database connection
        await dbHelpers.testConnection();
        logger.info('Profile generator service initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize profile generator service:', error);
        throw error;
    }
} 