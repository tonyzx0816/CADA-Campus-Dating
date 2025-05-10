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
            return getMatches(userId, res);
        default:
            return res.status(405).json({ message: "Method not allowed" });
    }
}

async function getMatches(userId: string, res: NextApiResponse) {
    try {
        const matches = await prisma.match.findMany({
            where: {
                OR: [
                    { firstUserId: userId },
                    { secondUserId: userId },
                ],
            },
            include: {
                firstUser: {
                    select: {
                        id: true,
                        name: true,
                        profile: {
                            select: {
                                preferredName: true,
                                gender: true,
                                major: true,
                                hobbies: true,
                                description: true,
                                dateOfBirth: true,
                                sexualOrientation: true,
                                photos: true, // get photos to use the first one as avatar
                            },
                        },
                    },
                },
                secondUser: {
                    select: {
                        id: true,
                        name: true,
                        profile: {
                            select: {
                                preferredName: true,
                                gender: true,
                                major: true,
                                hobbies: true,
                                description: true,
                                dateOfBirth: true,
                                sexualOrientation: true,
                                photos: true,
                            },
                        },
                    },
                },
            },
        });

        if (!matches || matches.length === 0) {
            return res.status(404).json({ message: "No matches found." });
        }

        const matchResults = matches.map((match) => {
            const otherUser =
                match.firstUserId === userId ? match.secondUser : match.firstUser;

            return {
                matchId: match.id,
                userId: otherUser.id,
                name: otherUser.name,
                avatar: otherUser.profile?.photos?.[0] ?? null, // first photo as avatar
                profile: otherUser.profile,
            };
        });

        return res.status(200).json(matchResults);

    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
}

