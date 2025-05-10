// pages/api/profile.ts
import {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/prisma/prisma';
import {getToken} from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const token = await getToken({ req });
    // Ensure token and user ID exist
    if (!token || !token.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = token.userId; // NextAuth stores user ID in 'sub'

    switch (req.method) {
        case 'GET':
            return getMatchableProfiles(userId, res);
        default:
            return res.status(405).json({ message: "Method not allowed" });
    }
}

async function getMatchableProfiles(userId: string, res: NextApiResponse) {
    try {
        const myProfile = await prisma.profile.findUnique({
            where: { userId },
        });

        if (!myProfile || !myProfile.genderPreference) {
            return res.status(404).json({ message: "No profile found or gender preference is not set" });
        }

        // Get the list of user IDs the current user has swiped
        const swipedUsers = await prisma.swipe.findMany({
            where: { swiperId: userId },
            select: { swipedId: true }
        });
        const swipedIds = swipedUsers.map(s => s.swipedId);

        // Get the list of user IDs the current user has matched with
        const matchedUsers = await prisma.match.findMany({
            where: {
                OR: [
                    { firstUserId: userId },
                    { secondUserId: userId }
                ]
            },
            select: {
                firstUserId: true,
                secondUserId: true
            }
        });
        const matchedIds = matchedUsers.flatMap(m =>
            m.firstUserId === userId ? [m.secondUserId] : [m.firstUserId]
        );

        const excludeIds = [...new Set([...swipedIds, ...matchedIds, userId])];

        const profiles = await prisma.profile.findMany({
            where: {
                gender: myProfile.genderPreference,
                userId: {
                    notIn: excludeIds
                }
            },
            include: {
                user: true
            }
        });

        return res.status(200).json(profiles);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
}

