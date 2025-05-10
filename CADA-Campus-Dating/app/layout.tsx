"use client";
import * as React from "react";
import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "@/app/globals.css";
import { SessionProvider, useSession } from "next-auth/react";
import FooterNavigation from "@/components/FooterNavigation";
import AppHeader from "@/components/AppHeader";
import { usePathname } from "next/navigation";
import {Toaster} from "@components/ui/toaster";

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head />
        <body>
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <ApplyLoadingStateForPage>
                    <div className="flex flex-col min-h-screen">
                        <AppHeader />
                        <main className="flex-1">
                            {children}
                        </main>
                        <Toaster />
                        <ConditionalFooter />
                    </div>
                </ApplyLoadingStateForPage>
            </ThemeProvider>
        </SessionProvider>
        </body>
        </html>
    );
}

    function ConditionalFooter() {
    const { status } = useSession();
    const pathname = usePathname();
    const [showFooter, setShowFooter] = useState(false);

    useEffect(() => {
        if (status !== "authenticated") {
            setShowFooter(false);
            return;
        }

        const checkProfileStatus = async () => {
            try {
                // Check if the user has a profile
                const response = await fetch('/api/profiles/');

                // If we're on the root path (tutorial page) and user has no profile, don't show footer
                if (pathname === "/" && response.status === 404) {
                    setShowFooter(false);
                    return;
                }

                // Otherwise, show footer for authenticated users
                setShowFooter(true);
            } catch (error) {
                console.error("Error checking profile status:", error);
                // If there's an error, be cautious and don't show the footer on the root path
                if (pathname === "/") {
                    setShowFooter(false);
                } else {
                    setShowFooter(true);
                }
            }
        };

        checkProfileStatus();
    }, [status, pathname]);

    if (!showFooter) {
        return null;
    }

    return <FooterNavigation />;
}

function ApplyLoadingStateForPage({ children }: { children: React.ReactNode }) {
    const { status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return <>{children}</>;
}