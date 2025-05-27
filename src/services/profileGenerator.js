import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../config/database.js';
import logger from '../config/logger.js';

// Generate iOS web clip profile for a web app
export async function generateProfile(app) {
    try {
        const profileId = uuidv4();
        const profile = {
            id: profileId,
            appId: app.id,
            displayName: app.name,
            url: app.url,
            icon: app.icon,
            timestamp: Date.now(),
            payload: generateProfilePayload(app)
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
function generateProfilePayload(app) {
    const payload = {
        PayloadContent: [{
            FullScreen: true,
            Icon: {
                Data: app.icon,
                ContentType: 'image/png'
            },
            IsRemovable: true,
            Label: app.name,
            PayloadDescription: `Configures web clip for ${app.name}`,
            PayloadDisplayName: `${app.name} Web Clip`,
            PayloadIdentifier: `com.crossloadr.webclip.${app.id}`,
            PayloadType: 'com.apple.webClip.managed',
            PayloadUUID: uuidv4(),
            PayloadVersion: 1,
            Precomposed: true,
            URL: app.url
        }],
        PayloadDescription: `Web clip profile for ${app.name}`,
        PayloadDisplayName: `${app.name} Web Clip Profile`,
        PayloadIdentifier: `com.crossloadr.profile.${app.id}`,
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
        const profile = await dbHelpers.getProfileByAppId(appId);
        if (!profile) {
            throw new Error(`No profile found for app ${appId}`);
        }

        const updatedProfile = {
            ...profile,
            ...updates,
            payload: generateProfilePayload({
                ...profile,
                ...updates
            }),
            timestamp: Date.now()
        };

        await dbHelpers.updateProfile(appId, updatedProfile);
        logger.info(`Updated profile for app ${appId}`);

        return updatedProfile;
    } catch (error) {
        logger.error(`Failed to update profile for app ${appId}:`, error);
        throw error;
    }
}

// Delete profile for an app
export async function deleteProfile(appId) {
    try {
        await dbHelpers.deleteProfile(appId);
        logger.info(`Deleted profile for app ${appId}`);
    } catch (error) {
        logger.error(`Failed to delete profile for app ${appId}:`, error);
        throw error;
    }
} 