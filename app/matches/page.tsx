"use client";

import {useSession} from "next-auth/react";
import {Button} from "@/components/ui/button";
import {Heart, Loader2, X} from "lucide-react";
import Image from 'next/image';
import * as React from "react"; // Import toast functionality
import {useCallback, useEffect, useState} from "react";
import {profileMatchPageDataSchema} from "@lib/formdata";
import z from "zod";
import {getProfilesForMatching} from "@lib/actions";
import {toast} from "@/components/ui/use-toast";


export default function MatchesPage() {
  const { data: session } = useSession();
  const userId = session?.user.userId as string;

  const [mainProfile, setMainProfile] = useState<z.infer<typeof profileMatchPageDataSchema> | null>(null);
  const [profileQueue, setProfileQueue] = useState<z.infer<typeof profileMatchPageDataSchema>[]>([]);
  const [needReloadProfiles, setNeedReloadProfiles] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getProfilesForMatching(userId);

      if (!data) throw new Error('Failed fetching profiles');

      const validProfiles = data
          .map((p) => profileMatchPageDataSchema.safeParse(p))
          .filter((parsed): parsed is { success: true; data: z.infer<typeof profileMatchPageDataSchema> } => parsed.success)
          .map((parsed) => parsed.data);

      setProfileQueue(validProfiles);
      setMainProfile(validProfiles[0] || null);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Couldn't load potential matches. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleRefresh = async () => {
    setNeedReloadProfiles(true);
    toast({
      title: "🍏🍏🍏",
      description: `Refreshed`,
      variant: "default",
    });
  }

  const handleSwipe = async (swipeRight: boolean) => {
    try {
      if (!mainProfile) return;

      const response = await fetch(`/api/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          swiperId: userId,
          swipedId: mainProfile.userId,
          swipeRight: swipeRight
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      if (swipeRight) {
        toast({
          title: "💔",
          description: `You liked ${mainProfile.preferredName}`,
          variant: "default",
        });
      }
      else {
        toast({
          title: "😔",
          description: `You skipped ${mainProfile.preferredName}`,
          variant: "destructive",
        });
      }

      // Move to the next profile
      setProfileQueue(prev => {
        const newProfiles = prev.slice(1);

        // If we now have few profiles, schedule a reload
        if (newProfiles.length <= 1) {
          setNeedReloadProfiles(true);
        }

        // Set the main profile to the next one
        setMainProfile(newProfiles[0] || null);
        return newProfiles;
      });

      // Check if it's a match
      const data = await response.json();
      if (data.isMatch) {
        toast({
          title: "It's a match!",
          description: `You and ${mainProfile.preferredName} have matched! Check your messages to start a conversation.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error processing swipe:", error);
      toast({
        title: "Swipe failed",
        description: "Couldn't process your response. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (needReloadProfiles) {
      fetchProfiles();
      setNeedReloadProfiles(false);
    }
  }, [fetchProfiles, needReloadProfiles]);

  // Loading state
  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-lg text-gray-600">Finding potential matches...</p>
        </div>
    );
  }

  // Error state
  if (error) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center max-w-md">
            <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => setNeedReloadProfiles(true)}>
              Try Again
            </Button>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen flex flex-col">
        <main className="flex flex-row justify-center items-start gap-20 px-6 py-8 w-full max-w-6xl mx-auto flex-grow">
          {/* Left side image with stacked bio and hobbies */}
          {mainProfile ? (
              <div className="w-full max-w-md flex justify-center items-start mt-14">
                <div className="w-[500px] h-[550px] rounded-2xl overflow-hidden relative">
                  <Image
                      src="/bg-top-left.png"
                      alt="Background"
                      width={1000}
                      height={500}
                      className="object-cover rounded-2xl"
                  />

                  {/* Bio and hobbies overlay on the background image */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-6 px-6">
                    {/* Bio section */}
                    {mainProfile.description && (
                        <div className="mb-5">
                          <h3 className="text-white font-bold text-2xl mb-2">About</h3>
                          <p className="text-white text-base">{mainProfile.description}</p>
                        </div>
                    )}

                    {/* Hobbies */}
                    {mainProfile.hobbies && mainProfile.hobbies.length > 0 && (
                        <div>
                          <h3 className="text-white font-bold text-2xl mb-2">Interests</h3>
                          <div className="flex flex-wrap gap-2">
                            {mainProfile.hobbies.map((hobby, index) => (
                                <span key={index} className="text-sm bg-purple-600 px-4 py-1.5 rounded-full text-white">
                          {hobby}
                        </span>
                            ))}
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
          ) : null}

          {/* Center logo */}
          <div className="flex justify-center items-center mt-10">
            <Image
                src="/cada_heart.png"
                alt="CADA Heart Logo"
                width={250}
                height={250}
                className="object-contain"
            />
          </div>

          {/* Main Profile Card */}
          <div className="w-full max-w-md flex justify-center items-start mt-14">
            {mainProfile ? (
                <div className="relative w-[550px] h-[550px] rounded-2xl overflow-hidden shadow-xl bg-black centered">
                  <Image
                      src={mainProfile.avatar ?? "/fallback.jpg"}
                      alt={`${mainProfile.preferredName || "Profile"}'s photo`}
                      fill
                      sizes="350px"
                      className="object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.src = "/fallback.jpg";
                      }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col gap-1">
                    <h2 className="text-xl font-bold">
                      {mainProfile.preferredName ?? "Anonymous"} (
                      {new Date().getFullYear() - new Date(mainProfile.dateOfBirth!).getFullYear()})
                    </h2>
                    <p className="text-sm">{mainProfile.major}</p>

                    <div className="flex justify-between mt-4">
                      <Button
                          variant="ghost"
                          size="icon"
                          className="bg-black/30 text-red-500 border border-red-500 rounded-full"
                          onClick={() => handleSwipe(false)}
                          aria-label="Pass"
                      >
                        <X />
                      </Button>
                      {/* Match Count Indicator */}
                      <p className="text-xs text-gray-300 mt-1">
                        {profileQueue.length > 1
                            ? `${profileQueue.length - 1} more potential ${profileQueue.length - 1 === 1 ? 'match' : 'matches'}`
                            : 'Last potential match'}
                      </p>

                      <Button
                          variant="ghost"
                          size="icon"
                          className="bg-purple-600 text-white rounded-full"
                          onClick={() => handleSwipe(true)}
                          aria-label="Like"
                      >
                        <Heart />
                      </Button>
                    </div>
                  </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md">
                  <h1 className="text-2xl font-bold mb-4">No matches found</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We couldn&#39;t find anyone matching your preferences right now. Check back later or update your preferences!
                  </p>
                  <Button onClick={handleRefresh}>
                    Refresh Matches
                  </Button>
                </div>
            )}
          </div>
        </main>
      </div>
  );
}