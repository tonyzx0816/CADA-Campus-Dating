// pages/api/users/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/prisma/prisma';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getSession({ req });

    // Authentication check
    if (!session || !session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = session.user.userId as string;

    try {
        // Get user with related data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                profile: {
                    select: {
                        gender: true,
                        hobbies: true,
                        description: true,
                        genderPreference: true,
                        sexualOrientation: true,
                        photos: true,
                    },
                },
                // Only include matches where the current user is involved
                // matches1: {
                //     where: {
                //         OR: [
                //             { user1Id: session.user.id },
                //             { user2Id: session.user.id },
                //         ],
                //     },
                //     select: {
                //         id: true,
                //         user1: { select: { id: true, name: true, avatar: true } },
                //         user2: { select: { id: true, name: true, avatar: true } },
                //     },
                // },
                // matches2: {
                //     where: {
                //         OR: [
                //             { user1Id: session.user.id },
                //             { user2Id: session.user.id },
                //         ],
                //     },
                //     select: {
                //         id: true,
                //         user1: { select: { id: true, name: true, avatar: true } },
                //         user2: { select: { id: true, name: true, avatar: true } },
                //     },
                // },
            },
        });

        if (!user) {
            return res.status(404).json({ message: `User with id ${userId} not found` });
        }

        // Combine matches from both relations
        // const allMatches = [...user.matches1, ...user.matches2];
        //
        // // Remove duplicate matches
        // const uniqueMatches = allMatches.filter(
        //     (match, index, self) => index === self.findIndex((m) => m.id === match.id)
        // );

        // Return user data with combined matches
        return res.status(200).json({
            ...user,
            // matches: uniqueMatches,
            matches1: undefined,
            matches2: undefined,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


