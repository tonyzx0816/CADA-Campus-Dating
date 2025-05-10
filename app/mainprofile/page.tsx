"use client";

import React, {useEffect, useState} from 'react';
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {Heading} from "@/components/ui/heading";
import {load6ImagesFromStorage} from "@lib/actions";
import {Button} from "@/components/ui/button";
import {Pencil, Trash2, X} from "lucide-react";
import Image from "next/image";
import {collection, deleteDoc, getDocs} from "firebase/firestore"
import db from "@lib/firestore"
import {toast} from "@/components/ui/use-toast";


// Type definition for profile data
interface ProfileData {
    preferredName?: string;
    gender?: string;
    sexualOrientation?: string;
    major?: string;
    dateOfBirth?: string;
    hobbies: string[];
    description?: string;
    photos: string[];
    genderPreference?: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [incompleteStep, setIncompleteStep] = useState<string | null>(null);
    // Flag to prevent multiple image loading attempts
    const [imagesLoaded, setImagesLoaded] = useState(false);
    // Delete confirmation dialog state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const userId = session?.user.userId as string;

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth?: string) => {
        if (!dateOfBirth) return null;
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const fetchMatches = async () => {
        try {
            const response = await fetch('/api/matches');

            if (response.status === 404) {
                // Handle the "No matches found" case specifically
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch matches: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching matches:", error);
        }
    }


    const deleteAllMatchesFromFirebase = async () => {
        try {
            const matches = await fetchMatches(); // This should give you an array of matchId strings

            if (!matches || matches.length === 0) {
                toast({
                    title: "All clear",
                    description: `All of your matches were deleted.`,
                    variant: "default",
                });

                return;
            }

            for (const match of matches) {
                const messagesCollectionRef = collection(db, `matches/chats/${match.matchId}`);
                const messagesSnapshot = await getDocs(messagesCollectionRef);

                for (const docSnap of messagesSnapshot.docs) {
                    await deleteDoc(docSnap.ref);
                }
            }

            toast({
                title: "All clear",
                description: `All of your matches were deleted.`,
                variant: "default",
            });

        } catch (error) {
            console.error("Error deleting matches from Firebase:", error);
        }
    };

    // Fetch profile data and check completeness
    useEffect(() => {
        const fetchProfileData = async () => {
            if (status !== "authenticated") {
                setLoading(false);
                return;
            }

            if (!userId) {
                console.error("No user identifier found in session");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/profiles/`);

                if (response.ok) {
                    const profileData = await response.json();
                    setProfile(profileData);

                    // Check if profile has required sections
                    checkProfileCompleteness(profileData);
                } else if (response.status === 404) {
                    // No profile found - redirect to profile creation
                    router.push('/onboarding');
                } else {
                    toast({
                        title: "Profile Issues:",
                        description: `Failed to load profile data.`,
                        variant: "destructive",
                    });
                }
            } catch {
                toast({
                    title: "Profile Issues:",
                    description: `Error fetching profile data`,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [status, session, router]);

    // Check if profile is missing any required sections
    const checkProfileCompleteness = (profileData: ProfileData) => {
        // Reset the incomplete step before checking
        let foundIncompleteStep = null;

        // Check basic info from onboarding page
        if (!profileData.preferredName || !profileData.gender || !profileData.major || !profileData.genderPreference) {
            foundIncompleteStep = 'onboarding';
        }
        // Only check next section if the previous one is complete
        else if (!profileData.description || !profileData.hobbies || profileData.hobbies.length === 0) {
            foundIncompleteStep = 'aboutme';
        }
        // Only check photos if everything else is complete
        else if (!profileData.photos || profileData.photos.length === 0) {
            // Also check imageUrls in case photos are loaded via storage
            if (imageUrls.length === 0) {
                foundIncompleteStep = 'images';
            }
        }

        // Set the incomplete step (or null if profile is complete)
        setIncompleteStep(foundIncompleteStep);
    };

    // Load images from storage - only run once when profile is first loaded
    useEffect(() => {
        // Only load images if we have a profile and haven't loaded images yet
        if (profile && !imagesLoaded && session?.user?.email) {
            const loadImagesFromStorage = async () => {
                try {

                    // Filter out any null values (images that couldn't be loaded)
                    const validUrls = await load6ImagesFromStorage(userId);

                    if (!validUrls) {
                        // toast - info
                        throw new Error("No imgs uploaded or fail to retrieve imgs urls");
                    }

                    if (validUrls.length > 0) {
                        setImageUrls(validUrls);

                        // Update the profile with images
                        setProfile(prevProfile => {
                            if (!prevProfile) return null;

                            // Create updated profile with the new photo URLs
                            const updatedProfile = {
                                ...prevProfile,
                                photos: validUrls
                            };

                            // Re-check completeness with updated profile data
                            checkProfileCompleteness(updatedProfile);

                            return updatedProfile;
                        });
                    } else {
                        // Re-check completeness with current profile data
                        // This ensures we catch the case where no images were found
                        if (profile) {
                            checkProfileCompleteness(profile);
                        }
                    }

                    // Mark images as loaded to prevent repeated loading
                    setImagesLoaded(true);
                } catch (error) {
                    console.error("Error loading images:", error);
                    // Still mark as loaded to prevent infinite retries
                    setImagesLoaded(true);
                }
            };

            loadImagesFromStorage();
        }
    }, [profile, session, imagesLoaded]);

    // Navigate to next photo
    const nextPhoto = () => {
        if (!imageUrls.length) return;
        setCurrentPhotoIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
    };

    // Navigate to previous photo
    const prevPhoto = () => {
        if (!imageUrls.length) return;
        setCurrentPhotoIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
    };

    // Handle edit profile - go to the specific section that needs editing
    const handleEditProfile = () => {
        if (incompleteStep) {
            // If there's an incomplete section, go directly to it
            router.push(`/${incompleteStep}`);
        } else {
            // If profile is complete, default to onboarding page
            router.push('/onboarding');
        }
    };

    // Handle delete profile
    const handleDeleteProfile = async () => {
        if (!userId) return;

        setIsDeleting(true);
        try {
            // Call the DELETE API endpoint


            const response = await fetch('/api/profiles', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            deleteAllMatchesFromFirebase();

            if (response.ok) {
                toast({
                    title: "Delete profile success",
                    description: "Profile deleted successfully",
                    variant: "default",
                });

                // Sign out and redirect to login page
                setTimeout(() => {
                    router.push('/api/auth/signout');
                }, 3000); // 3 secs
            } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete profile");
            }
        } catch (error) {
            toast({
                title: "All clear",
                description:  error instanceof Error ? error.message : "Failed to delete profile",
                variant: "destructive",
            });

        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Format hobby string for display
    const formatHobby = (hobbyKey: string) => {
        if (hobbyKey.startsWith('custom_')) {
            // Format custom hobby: remove prefix, replace underscores with spaces, capitalize words
            const formattedHobby = hobbyKey
                .replace('custom_', '')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            return formattedHobby;
        }

        // For predefined hobbies, use as is (would ideally use allHobbies() but keeping it simple)
        return hobbyKey;
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                <p className="ml-3 text-lg text-gray-700">Loading your profile...</p>
            </div>
        );
    }

    // No profile state - redirect to profile creation
    if (!profile) {
        router.push('/onboarding');
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                <p className="ml-3 text-lg text-gray-700">Redirecting to profile creation...</p>
            </div>
        );
    }

    // Incomplete profile banner
    const IncompleteBanner = () => {
        if (!incompleteStep) return null;

        const stepMessages = {
            'onboarding': 'Your basic profile information is incomplete.',
            'aboutme': 'Please complete your about me section and hobbies.',
            'images': 'Your profile needs at least one photo.'
        };

        const message = stepMessages[incompleteStep as keyof typeof stepMessages] || 'Your profile is incomplete.';

        return (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-amber-700">
                            {message}
                            <button
                                onClick={() => router.push(`/${incompleteStep}`)}
                                className="ml-2 font-medium underline text-amber-800 hover:text-amber-600"
                            >
                                Complete now
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // Determine which photos to display - prefer imageUrls if available
    const displayPhotos = imageUrls.length > 0 ? imageUrls : (profile.photos || []);
    const hasPhotos = displayPhotos.length > 0;

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl">
            {/* Header */}
            <header className="mb-4 border-b pb-4 flex justify-between items-center">
                <Heading>My Profile</Heading>
                <div className="flex gap-2">
                    {/* Edit button */}
                    <Button
                        onClick={handleEditProfile}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                    >
                        <Pencil size={16} />
                        Edit Profile
                    </Button>

                    {/* Delete button */}
                    <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1"
                    >
                        <Trash2 size={16} />
                        Delete Profile
                    </Button>
                </div>
            </header>

            {/* Custom Delete confirmation modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                     onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold">Are you absolutely sure?</h3>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            This action cannot be undone. This will permanently delete your profile,
                            all your photos, matches, and messages from our servers.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                onClick={() => setShowDeleteConfirm(false)}
                                variant="outline"
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteProfile}
                                variant="destructive"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete Profile"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incomplete profile warning if needed */}
            <IncompleteBanner />

            <div className="flex flex-col">
                {/* Profile photo */}
                <div className="w-full mb-6">
                    <div className="aspect-square rounded-lg overflow-hidden max-w-md mx-auto">
                        {hasPhotos ? (
                            <div className="relative w-full h-full">
                                {/*<Image src="/cada_heart.png" alt="Heart" width={48} height={48} className="w-12 h-12" />*/}
                                <Image
                                    src={displayPhotos[currentPhotoIndex]}
                                    alt={`Profile photo ${currentPhotoIndex + 1}`}
                                    className="object-cover w-full h-full"
                                    fill
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = '/no-photo.png';
                                    }}
                                />

                                {/* Photo navigation (only if multiple photos) */}
                                {displayPhotos.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevPhoto}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full"
                                            aria-label="Previous photo"
                                        >
                                            ←
                                        </button>
                                        <button
                                            onClick={nextPhoto}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full"
                                            aria-label="Next photo"
                                        >
                                            →
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                <p className="text-gray-500">No photos uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Photo carousel indicators */}
                    {hasPhotos && displayPhotos.length > 1 && (
                        <div className="flex justify-center mt-2 space-x-1">
                            {displayPhotos.map((_, index) => (
                                <div
                                    key={index}
                                    onClick={() => setCurrentPhotoIndex(index)}
                                    className={`h-1 rounded-full cursor-pointer transition-all ${
                                        index === currentPhotoIndex ? 'bg-purple-600 w-8' : 'bg-gray-300 w-1'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Profile info */}
                <div className="pb-16">
                    <h2 className="text-2xl font-bold mb-4">
                        {profile.preferredName || session?.user?.name || "User"}
                        {profile.dateOfBirth && ` (${calculateAge(profile.dateOfBirth)})`}
                    </h2>

                    <div className="space-y-4">
                        {profile.major && (
                            <div className="flex items-center gap-2">
                                <span>🎓</span>
                                <span className="capitalize">Major: {profile.major}</span>
                            </div>
                        )}

                        {profile.gender && (
                            <div className="flex items-center gap-2">
                                <span>👤</span>
                                <span className="capitalize">
                                    Gender: {profile.gender}
                                    {profile.sexualOrientation && ` • Orientation: ${profile.sexualOrientation}`}
                                </span>
                            </div>
                        )}

                        {profile.hobbies && profile.hobbies.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span>🎯</span>
                                    <span className="font-medium">Hobbies & Interests:</span>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-6">
                                    {profile.hobbies.map((hobby, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm capitalize"
                                        >
                                            {formatHobby(hobby)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profile.description && (
                            <div className="mt-6">
                                <div className="flex items-start gap-2 mb-2">
                                    <span className="mt-1">✨</span>
                                    <span className="font-medium">About Me:</span>
                                </div>
                                <div className="ml-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="whitespace-pre-line">{profile.description}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}