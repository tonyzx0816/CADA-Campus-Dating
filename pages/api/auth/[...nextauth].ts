import NextAuth, { NextAuthOptions } from "next-auth";

import GoogleProvider from "next-auth/providers/google";
import {prisma} from "@/prisma/prisma";
import {NextApiRequest, NextApiResponse} from "next";



export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        // this run first
        async signIn({user, profile}) {
            // Check if the profile email exists

            if (!user || !profile?.email) {
                console.error("Missing user or profile information");
                return "/login?error=OAuthCanceled"; // Redirect on missing data
            }

            if (!user?.email) {

                throw new Error("User doesn't exist!");
            }
            if (!profile?.email) {
                throw new Error("User doesn't exist!");
            }

            // Use Prisma `upsert` to create or update the user
            try {
                await prisma.user.upsert({
                    where: {email: profile.email},
                    update: {
                        name: profile.name,   // Update user's name if they already exist
                        // image: profile.picture, // Update user's profile picture
                    },
                    create: {
                        email: profile.email, // Create user if they don't exist
                        name: profile.name!,
                        avatar: user.image || profile.image!,
                    },
                })
            } catch (err) {
                console.error("Prisma upsert error:", err);
                return "/login?error=DatabaseError"; // Redirect on DB errors
            };

            return true; // Allow sign-in
        },
        // this run 2nd
        async jwt({token, account, profile}) {
            if (account) {
                token.accessToken = account.access_token;
            }

            if (profile) {
                try {
                    const userInDb = await prisma.user.findUnique({
                        where: {email: profile.email}
                    })
                    if (userInDb) {
                        token.userId = userInDb.id;
                    }

                } catch (err) {
                    console.error("Prisma upsert error:", err);
                };

                token.email = profile.email;
            }
            return token;
        },
        // this run last
        async session({ session, token }) {
            if (token && session.user) {
                session.user.userId = token.userId as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/',
    },
};

// Default export as Next.js API route handler

const auth  = (req: NextApiRequest, res: NextApiResponse) => NextAuth(req, res, authOptions);
export default auth;
