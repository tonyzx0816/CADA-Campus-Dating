// pages/api/users/[id].ts
import {NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/pages/api/auth/[...nextauth]";
import {allGenders} from "@lib/data";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions) // to allow only valid session (authenticated users)

    // Authentication check
    if (!session || !session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        return res.status(200).json({
           genders: allGenders,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


