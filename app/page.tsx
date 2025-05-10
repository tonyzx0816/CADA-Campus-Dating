'use client'
import * as React from "react"
import {useEffect, useState} from "react"
import {signIn, useSession} from "next-auth/react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import Image from "next/image";

interface ImageCarouselProps {
    images: string[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
    altText: string;
}

export default function TutorialPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    // State to track current image in each carousel
    const [currentProfileImage, setCurrentProfileImage] = useState(0)
    const [currentMatchImage, setCurrentMatchImage] = useState(0)
    const [currentChatImage, setCurrentChatImage] = useState(0)

    // Check if user should actually be on this page
    useEffect(() => {
        // If user is authenticated, check if they should see the tutorial
        if (status === "authenticated") {
            const checkProfile = async () => {
                try {
                    const response = await fetch(`/api/profiles/`);
                    // If user has a profile and has seen tutorial, redirect to matches
                    if (response.ok && localStorage.getItem('cada_tutorial_seen') === 'true') {
                        router.push('/matches');
                    }
                } catch (error) {
                    console.error("Error checking profile:", error);
                }
            };

            checkProfile();
        }
    }, [status, router]);

    // Profile images from public folder
    const profileImages = [
        "/profile1.png",
        "/profile2.png",
        "/profile3.png"
    ]

    // Match images (replace with actual image paths if you have them)
    const matchImages = [
        "/match1.png", // Replace with actual match screenshots
        "/match2.png",
    ]

    // Chat images (replace with actual image paths if you have them)
    const chatImages = [
        "/chat1.png", // Replace with actual chat screenshots
        "/chat2.png",
    ]

    // Navigation functions for profile images
    const nextProfileImage = () => {
        setCurrentProfileImage((prev) =>
            prev === profileImages.length - 1 ? 0 : prev + 1
        )
    }

    const prevProfileImage = () => {
        setCurrentProfileImage((prev) =>
            prev === 0 ? profileImages.length - 1 : prev - 1
        )
    }

    // Navigation functions for match images
    const nextMatchImage = () => {
        setCurrentMatchImage((prev) =>
            prev === matchImages.length - 1 ? 0 : prev + 1
        )
    }

    const prevMatchImage = () => {
        setCurrentMatchImage((prev) =>
            prev === 0 ? matchImages.length - 1 : prev - 1
        )
    }

    // Navigation functions for chat images
    const nextChatImage = () => {
        setCurrentChatImage((prev) =>
            prev === chatImages.length - 1 ? 0 : prev + 1
        )
    }

    const prevChatImage = () => {
        setCurrentChatImage((prev) =>
            prev === 0 ? chatImages.length - 1 : prev - 1
        )
    }

    // Handle profile creation - now also marks tutorial as seen
    const handleCreateProfile = () => {
        // Mark tutorial as seen in localStorage
        localStorage.setItem('cada_tutorial_seen', 'true');

        // Redirect to profile creation
        router.push('/onboarding');
    }

    // Still loading session
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mr-3"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        )
    }

    // Not authenticated, show sign in page
    if (!session) {
        return (
            <div className="relative w-full h-screen bg-gray-800 overflow-hidden">
                {/* watermark */}
                <Image
                    src="/sjsulogo.png"
                    alt="SJSU Logo"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.05] w-[4000px] h-[750px]"
                    width={4000}
                    height={750}
                />

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-8 text-center">
                    {/* heart icon snug up against the heading */}
                    <h1 className="flex items-center text-5xl font-bold text-white mb-4">
                        <img
                            src="/cada_heart.png"
                            alt="heart icon"
                            className="w-20 h-20 -mr-2"
                        />
                        <span>CADA: Campus Dating</span>
                    </h1>

                    <p className="text-xl text-gray-300 mb-8 max-w-xl">
                        CADA is an exclusive campus dating platform for students.
                        <br />
                        Meet, connect, and build real relationships on campus.
                    </p>

                    <Button
                        onClick={() => signIn("google")}
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg font-semibold shadow-md"
                    >
                        Sign in with your SJSU email
                    </Button>
                </div>
            </div>
        );
    }


    // Image carousel component - LARGER VERSION

    const ImageCarousel = ({ images, currentIndex, onNext, onPrev, altText }: ImageCarouselProps) => (
        <div className="relative rounded-lg overflow-hidden w-full max-w-xl mx-auto shadow-xl">
            {/* Use a more prominent aspect ratio - closer to screenshot */}
            <div className="aspect-[4/5]">
                <img
                    src={images[currentIndex]}
                    alt={`${altText} screenshot ${currentIndex + 1}`}
                    className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800"
                />
            </div>

            {/* Larger navigation arrows */}
            <button
                onClick={onPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all shadow-lg"
                aria-label="Previous image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>

            <button
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all shadow-lg"
                aria-label="Next image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </button>

            {/* Larger indicator dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, index: number) => (
                    <div
                        key={index}
                        className={`h-3 rounded-full transition-all ${
                            index === currentIndex
                                ? "w-8 bg-white"
                                : "w-3 bg-white bg-opacity-50"
                        }`}
                    />
                ))}
            </div>

            {/* Image counter */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    )

    // Authenticated user sees tutorial - Remove the header since we now have a global header
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 pt-20">
            {/* Main content with tutorial sections */}
            <main className="container mx-auto px-4 pt-4 pb-16">
                {/* Welcome section */}
                <section className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-6">Welcome to CADA</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Let&#39;s get you started with finding meaningful connections on campus!
                    </p>
                </section>

                {/* Tutorial sections - REVISED FOR BIGGER IMAGES */}
                <div className="space-y-32">
                    {/* Step 1 */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl font-bold mb-6">Create Your Profile</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                                Tell us about yourself and what you&#39;re looking for. This helps us find the perfect matches for you.
                            </p>
                            <ul className="list-disc pl-6 text-lg text-gray-600 dark:text-gray-300 space-y-3">
                                <li>Share your interests and hobbies</li>
                                <li>Upload your favorite photos</li>
                                <li>Tell us what you&#39;re looking for</li>
                            </ul>
                        </div>
                        <div className="order-1 lg:order-2">
                            <ImageCarousel
                                images={profileImages}
                                currentIndex={currentProfileImage}
                                onNext={nextProfileImage}
                                onPrev={prevProfileImage}
                                altText="Profile Creation"
                            />
                        </div>
                    </section>

                    {/* Step 2 */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <ImageCarousel
                                images={matchImages}
                                currentIndex={currentMatchImage}
                                onNext={nextMatchImage}
                                onPrev={prevMatchImage}
                                altText="Matching"
                            />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Find Your Matches</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                                Our algorithm helps you connect with people who share your interests and preferences.
                            </p>
                            <ul className="list-disc pl-6 text-lg text-gray-600 dark:text-gray-300 space-y-3">
                                <li>Browse potential matches</li>
                                <li>See compatibility ratings</li>
                                <li>Connect with people you&#39;re interested in</li>
                            </ul>
                        </div>
                    </section>

                    {/* Step 3 */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl font-bold mb-6">Chat and Connect</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                                Start meaningful conversations with your matches and build connections.
                            </p>
                            <ul className="list-disc pl-6 text-lg text-gray-600 dark:text-gray-300 space-y-3">
                                <li>Send messages to your matches</li>
                                <li>Arrange to meet in person</li>
                            </ul>
                        </div>
                        <div className="order-1 lg:order-2">
                            <ImageCarousel
                                images={chatImages}
                                currentIndex={currentChatImage}
                                onNext={nextChatImage}
                                onPrev={prevChatImage}
                                altText="Chat"
                            />
                        </div>
                    </section>
                </div>

                {/* Call to action */}
                <div className="text-center mt-32 bg-white dark:bg-gray-800 p-12 rounded-xl shadow-md">
                    <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                        Create your profile now and start connecting with other students on campus!
                    </p>
                    <Button
                        onClick={handleCreateProfile}
                        className="px-10 py-6 text-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full shadow-lg"
                    >
                        Create Your Profile
                    </Button>
                </div>
            </main>

            {/* Footer with explicit sign out option */}
            <footer className="bg-white dark:bg-gray-800 py-6 shadow-inner mt-15">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">© 2025 CADA. Campus Dating App. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}