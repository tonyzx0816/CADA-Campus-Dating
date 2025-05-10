"use client";

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ProfileData {
    preferredName?: string;
    gender?: string;
    sexualOrientation?: string;
    dateOfBirth?: string;
    hobbies: string[];
    description?: string;
    photos: string[];
}

export default function ProfileRouter() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Get user identifier
    const getUserId = () => {
        if (!session?.user) return null;
        return session.user.userId || session.user.email;
    };

    useEffect(() => {
        const routeToCorrectPage = async () => {
            // Handle non-authenticated users


            // Wait for session to load
            if (status === "loading") {
                return;
            }

            const userId = getUserId();
            if (!userId) {
                console.error("No user identifier found in session");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/profiles`);

                if (response.ok) {
                    // Profile exists, check if complete
                    const profileData: ProfileData = await response.json();

                    //Check step 1: Basic info
                    if (!profileData.preferredName || !profileData.gender || !profileData.dateOfBirth) {
                        router.push('/onboarding');
                        return;
                    }

                   // Check step 2: About me
                    if (!profileData.description || !profileData.hobbies || profileData.hobbies.length === 0) {
                        router.push('/aboutme');
                        return;
                    }

                    // Check step 3: Photos
                    if (!profileData.photos || profileData.photos.length === 0) {
                        router.push('/images');
                        return;
                    }

                    // Profile is complete
                    router.push('/mainprofile');

                } else if (response.status === 404) {
                    // Profile doesn't exist, start at onboarding
                     router.push('/onboarding');
                } else {
                    console.error("Failed to fetch profile data:", response.status);
                    // On error, just go to main profile page (will handle errors there)
                    router.push('/mainprofile');
                }
            } catch (error) {
                console.error('Error routing to profile page:', error);
                router.push('/mainprofile');
            } finally {
                setLoading(false);
            }
        };

        routeToCorrectPage();
    }, [status, session, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading profile...</p>
            </div>
        );
    }

    // This should never be displayed as we're always redirecting
    return null;
}