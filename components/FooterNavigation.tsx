"use client";
import * as React from "react";
import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export default function FooterNavigation() {
    const [profileComplete, setProfileComplete] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const pathname = usePathname() || "";

    // Check if profile exists and is complete
    useEffect(() => {
        const checkProfileStatus = async () => {
            try {
                const response = await fetch(`/api/profiles/`);

                if (response.ok) {
                    // Profile exists - consider it complete for navigation purposes
                    setProfileComplete(true);
                } else if (response.status === 404) {
                    // No profile found
                    setProfileComplete(false);
                } else {
                    console.error("Failed to fetch profile data:", response.status);
                    setProfileComplete(false); // Default to incomplete
                }
            } catch (error) {
                console.error('Error checking profile status:', error);
                setProfileComplete(false);
            } finally {
                setProfileLoading(false);
            }
        };

        checkProfileStatus();
    }, [status, pathname]); // Also check when pathname changes to update status after profile creation

    // Determine profile link target based on completion status
    const getProfileLink = () => {
        // If profile is complete, go to main profile, otherwise to profile router
        return profileComplete ? "/mainprofile" : "/profile";
    };

    // Determine if on a profile-related page
    const isProfileRelatedPage = () => {
        const profilePages = [
            "/mainprofile",
            "/profile",
            "/onboarding",
            "/aboutme",
            "/images"
        ];
        return profilePages.includes(pathname);
    };

    // Active link style helper
    const isActive = (path: string): string => {
        if (path === "/mainprofile" && isProfileRelatedPage()) {
            return "text-purple-600 font-bold";
        }

        return pathname === path ? "text-purple-600 font-bold" : "";
    };

    return (
        <footer className="fixed bottom-0 left-0 right-0 border-t bg-white dark:bg-gray-800 py-3 flex justify-around items-center text-xs z-50">

            {/* Matches */}
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <Link href="/matches" legacyBehavior passHref>
                            <NavigationMenuLink
                                className={`${navigationMenuTriggerStyle()} ${isActive('/matches')}`}
                            >
                                Matches
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>

            {/* Chats */}
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <Link href="/chats" legacyBehavior passHref>
                            <NavigationMenuLink
                                className={`${navigationMenuTriggerStyle()} ${isActive('/chats')}`}
                            >
                                Chats
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>

            {/* Profile - routes to mainprofile if profile exists, otherwise to profile router */}
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <Link href={profileLoading ? "#" : getProfileLink()} legacyBehavior passHref>
                            <NavigationMenuLink
                                className={`${navigationMenuTriggerStyle()} ${isActive('/mainprofile')}`}
                            >
                                Profile
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </footer>
    );
}