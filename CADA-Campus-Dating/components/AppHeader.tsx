"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image';

export default function AppHeader() {
    const { data: session, status } = useSession();

    // Handle sign out
    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    // Don't show header when not authenticated or loading
    if (status !== "authenticated") {
        return null;
    }

    return (
        <>
            {/* Placeholder div to push content down - same height as header */}
            <div className="h-16"></div>

            {/* Actual header */}
            <header className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-sm z-30 py-3">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <div className="flex items-center gap-3 cursor-pointer">
                                <Image 
                                    src="/cada_heart.png" 
                                    alt="CADA Logo" 
                                    className="w-7 h-7"
                                    width={50}
                                    height={50}
                                />
                                <h1 className="text-lg font-bold">CADA</h1>
                            </div>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium hidden sm:inline-block">{session.user?.name}</span>
                        <Image
                            src={session.user?.image || "https://via.placeholder.com/40"}
                            alt="Profile"
                            className="w-7 h-7 rounded-full"
                            width={40}
                            height={40}
                        />
                        {/* Sign out button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSignOut}
                            className="text-xs py-1"
                        >
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>
        </>
    );
}