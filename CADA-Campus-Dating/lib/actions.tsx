"use server"

import {Storage} from "@google-cloud/storage";
import process from "node:process";
import {prisma} from "@/prisma/prisma";


const storage = new Storage({
    credentials: {
        project_id: process.env.GC_PROJECT_ID,
        private_key: process.env.GC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GC_CLIENT_EMAIL,
    },
});

const bucket = storage.bucket(process.env.GC_BUCKET!);



export const getProfile = async (userId: string) => {
    const profile = await prisma.profile.findUnique({
        where: { userId }
    });

    if (!profile) {
        throw new Error("profile bad")
    }
    const result = await loadFirstImageFromStorage(userId);
    if (!result) {
        throw new Error("Avatar not found for user: ")
    }
    return {
        ...profile,
        avatar: result || null
    };
}


export const getProfilesForMatching = async (userId: string) => {
    const myProfile = await prisma.profile.findUnique({
        where: { userId },
    });

    if (!myProfile || !myProfile.genderPreference) {
        throw new Error("No profile or gender preference set");
    }

    const profilesINeverSwipedOn = await prisma.profile.findMany({
        where: {
            gender: myProfile.genderPreference,
            userId: {
                not: userId, // exclude myself
            },
            user: {
                swipingUsers: {
                    none: {
                        swiperId: userId, // I haven't swiped on them
                    },
                },
            },
        },
        include: {
            user: true,
        },
        take: 3, // optional: limit number of results
    });

// Load avatars for each profile
    const profilesWithAvatar = await Promise.all(
        profilesINeverSwipedOn.map(async (profile) => {

            let avatar: string | null;
            if (process.env.NODE_ENV == "development" ) {
                avatar = await loadFirstImageFromStorage(userId);
            }
            else {
                avatar = await loadFirstImageFromStorage(profile.userId);
            }

            return {
                ...profile,
                avatar: avatar || null,
            };
        })
    );

    return profilesWithAvatar;
}


const loadFirstImageFromStorage = async (userId: string): Promise<string | null> => {
    try {
        const images = await load6ImagesFromStorage(userId);
        return images ? images[0] : null;
    } catch (error) {
        console.error("Error loading images:", error);
        throw error;
    }
};

export const load6ImagesFromStorage = async (userId: string) => {
    try {
        // Try to load 6 images (indexes 0-5)
        const urls = await Promise.all(
            Array(6).fill(null).map((_, index) =>
                getImageUrl(`${userId}/${index}`)
                    .then(url => url)
                    .catch(console.error) // Return null if image doesn't exist
            )
        );
        // Filter out any null values (images that couldn't be loaded)
        const validUrls = urls.filter(url => url !== null) as string[];
        if (validUrls.length > 0) {
            return validUrls; // first url only for avatar
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error loading images:", error);
        throw error;
    }
};



export const getSignedUrl = async (fileName: string, fileType: string) => {
    // I am not including the key in the github repo, but this key goes in the root of the project.
    const storage = new Storage({
        credentials: {
            project_id: process.env.GC_PROJECT_ID,
            private_key: process.env.GC_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Fix newline issue
            client_email: process.env.GC_CLIENT_EMAIL,
        },
    });


    const bucket = storage.bucket(process.env.GC_BUCKET!);

    const [url] = await bucket // TO DO: fix
        .file(`${fileName}`)
        .getSignedUrl(
            {
                action: 'write',
                version: 'v4',
                expires: Date.now() + 15 * 60 * 1000,
                contentType: fileType,
            }
        );

    return url;
}





export const getImageUrl = async (fileName: string): Promise<string | null> => {
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    if (!exists) {
        return null; // or throw an error if you want
    }

    const [url] = await file.getSignedUrl({
        action: "read",
        version: "v4",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return url;
};


export const get6ImageUrls = async (userId: string) => {
    const urls = [];
    for (let i = 0; i < 6; i++) {
        const [url] = await bucket
            .file(`${userId}/${i}`)
            .getSignedUrl({
                action: "read", // CHANGE HERE: 'read' instead of 'write'
                version: "v4",
                expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            });
        urls.push(url);
    }
    return urls;
};



export async function getUserIdByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) throw new Error('User not found');
    return user.id;
}


export async function countObjectsInFolder(userId: string) {
    const storage = new Storage({
        credentials: {
            project_id: process.env.GC_PROJECT_ID,
            private_key: process.env.GC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GC_CLIENT_EMAIL,
        },
    });

    const bucket = storage.bucket(process.env.GC_BUCKET!);

    try {
        // List files in the folder named after userId
        const [files] = await bucket.getFiles({
            prefix: `${userId}/`,
        });
        //
        // // Filter out the folder placeholder and any subfolder placeholders
        // const objects = files.filter(file => {
        //     // Exclude the folder itself and empty "directory markers"
        //     return file.name !== `${userId}/` && !file.name.endsWith('/');
        // });

        return files.length;
    } catch (error) {
        console.error('Error counting objects in GCS folder:', error);
        throw error;
    }
}

/**
 * Delete a user's profile and all related data
 * This includes:
 * 1. Deleting all their photos from Google Cloud Storage
 * 2. Deleting their profile from the database
 * 3. Related data like matches, messages, etc. will be deleted by cascade
 */
export const deleteUserProfile = async (userId: string) => {
    try {
        // 1. Delete photos from Google Cloud Storage
        await deleteUserPhotos(userId);

        // 2. Delete profile from database
        // This will cascade to delete:
        // - Profile (direct)
        // - Swipes (via cascading delete from User)
        // - Matches (via cascading delete from User)
        // - Messages (via cascading delete from Match)
        // - StudySessions (via cascading delete from User)
        // All based on the schema.prisma file
        await prisma.user.delete({
            where: { id: userId },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting user profile:", error);
        throw new Error("Failed to delete user profile");
    }
};

/**
 * Delete all photos associated with a user
 */
const deleteUserPhotos = async (userId: string) => {
    try {
        // Get list of files in the user's folder
        const [files] = await bucket.getFiles({
            prefix: `${userId}/`,
        });

        // Delete each file
        if (files.length > 0) {
            await Promise.all(
                files.map(file => file.delete())
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Error deleting user photos:", error);
        throw new Error("Failed to delete user photos");
    }
};