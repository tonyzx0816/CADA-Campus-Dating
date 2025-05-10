"use client";
import * as React from "react";
import { FormEvent, useEffect, useState } from "react";
import { ImageUploader } from "@components/ui/image-uploader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSignedUrl, getUserIdByEmail, getImageUrl } from "@lib/actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ImageUploadPage() {
    const [images, setImages] = useState<(File | null)[]>(Array(6).fill(null));
    const [previewUrls, setPreviewUrls] = useState<(string | null)[]>(Array(6).fill(null));
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        const loadImages = async () => {
            if (!session?.user?.email) return;
            try {
                const userId = await getUserIdByEmail(session.user.email);
                const urls = await Promise.all(
                    Array(6).fill(null).map((_, index) =>
                        getImageUrl(`${userId}/${index}`).catch(() => null) // catch if file doesn't exist
                    )
                );
                setPreviewUrls(urls);
            } catch (error) {
                console.error("Error loading image URLs", error);
            }
        };

        loadImages();
    }, [session]);

    const handleFileUpload = (file: File, index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            newImages[index] = file;
            return newImages;
        });

        // Immediately update preview for UX
        setPreviewUrls(prev => {
            const newPreviews = [...prev];
            newPreviews[index] = URL.createObjectURL(file);
            return newPreviews;
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setUploading(true);
        setUploadProgress(0);

        const filesToUpload = images.map((img, idx) => ({ file: img, index: idx })).filter(({ file }) => file !== null) as { file: File, index: number }[];

        if (filesToUpload.length === 0) {
            toast.error("No images to upload!");
            setUploading(false);
            return;
        }

        let successCount = 0;
        const totalUploads = filesToUpload.length;

        for (const { file, index } of filesToUpload) {
            try {
                const userId = await getUserIdByEmail(session!.user.email!);
                const url = await getSignedUrl(`${userId}/${index}`, file.type);

                const response = await fetch(url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type
                    },
                });

                if (response.ok) {
                    successCount++;
                    setUploadProgress(Math.floor((successCount / totalUploads) * 100));
                    toast.success(`Image ${index + 1} uploaded!`);
                } else {
                    toast.error(`Failed to upload image ${index + 1}`);
                }
            } catch (error) {
                toast.error(`Upload error: image ${index + 1}`);
                console.error("Upload error", error);
            }
        }

        // After all uploads are done
        setUploading(false);

        if (successCount === totalUploads) {
            toast.success("All images uploaded successfully!");

            // Create a small delay to allow the user to see the success message
            setTimeout(() => {
                // Save image URLs to profile in database
                updateProfileWithImageURLs();
            }, 1000);
        } else if (successCount > 0) {
            toast.warning(`Uploaded ${successCount} of ${totalUploads} images`);
            // Still update profile with the images that were successfully uploaded
            setTimeout(() => {
                updateProfileWithImageURLs();
            }, 1000);
        } else {
            toast.error("Failed to upload any images");
        }
    };

    const updateProfileWithImageURLs = async () => {
        if (!session?.user?.email) return;

        try {
            const userId = await getUserIdByEmail(session.user.email);

            // Generate URLs for all successfully uploaded images
            const imageUrls = await Promise.all(
                Array(6).fill(null).map((_, index) =>
                    getImageUrl(`${userId}/${index}`).catch(() => null)
                )
            );

            // Filter out null values
            const validUrls = imageUrls.filter(url => url !== null) as string[];

            // Get existing profile data
            const profileResponse = await fetch(`/api/profiles/`);
            let profileData = {};

            if (profileResponse.ok) {
                profileData = await profileResponse.json();
            }

            // Update profile with image URLs
            const response = await fetch(`/api/profiles/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...profileData,
                    photos: validUrls
                }),
            });

            if (response.ok) {
                toast.success("Profile updated with new images!");
                // Navigate to mainprofile page after a short delay
                setTimeout(() => {
                    router.push('/mainprofile');
                }, 1000);
            } else {
                toast.error("Failed to update profile with images");
                console.error("Failed to update profile:", response.status);
            }
        } catch (error) {
            console.error("Error updating profile with images:", error);
            toast.error("Error saving images to profile");
        }
    };

    const handleSkip = () => {
        // When user skips, still go to the mainprofile page
        router.push('/mainprofile');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20 bg-gray-50 dark:bg-gray-900">
            <main className="flex flex-col gap-6 items-center">
                <form onSubmit={handleSubmit} className="w-full max-w-3xl">
                    <h1 className="text-3xl font-bold mb-6 text-center">Upload your profile pictures</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                        Upload up to 6 photos that represent you. You can change these photos anytime.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {Array(6).fill(null).map((_, index) => (
                            <ImageUploader
                                key={index}
                                onUpload={(file) => handleFileUpload(file, index)}
                                hideLabel={true}
                                hideSubmitButton={true}
                                preloadedImage={previewUrls[index]}
                            />
                        ))}
                    </div>

                    {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                            <div
                                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkip}
                            className="px-6"
                        >
                            Skip
                        </Button>

                        <Button
                            type="submit"
                            className="px-8"
                            disabled={uploading}
                        >
                            {uploading ? "Uploading..." : "Save All Images"}
                        </Button>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Continue (3/3) - This is the final step!
                    </p>
                </form>
            </main>
        </div>
    );
}