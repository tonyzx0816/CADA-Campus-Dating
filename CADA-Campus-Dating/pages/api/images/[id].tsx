import {NextApiRequest, NextApiResponse} from "next";
import {z} from "zod";
import {getImageUrl} from "@/lib/actions";
import {getToken} from "next-auth/jwt"; // assume you have this function

const indexSchema = z
    .string()
    .transform(Number)
    .refine((val) => Number.isInteger(val) && val >= 0 && val <= 5, {
        message: "Index must be an integer between 0 and 5",
    });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const token = await getToken({ req });
    // Ensure token and user ID exist
    if (!token || !token.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const userId  = token.userId;


    const { index } = req.query;

    const parseResult = indexSchema.safeParse(index);

    if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0].message });
    }

    const imageIndex = parseResult.data;

    switch (req.method) {
        case "GET":
            return getImageByUserIdAndIndex(userId, imageIndex, res);
        default:
            return res.status(405).json({ message: "Method not allowed" });
    }
}

async function getImageByUserIdAndIndex(userId: string, index: number, res: NextApiResponse) {
    try {
        const url = await getImageUrl(`${userId}/${index}`);
        return res.status(200).json({ url });
    } catch (error) {
        console.error("Error fetching image URL:", error);
        return res.status(500).json({ message: "Failed to fetch image URL" });
    }
}
