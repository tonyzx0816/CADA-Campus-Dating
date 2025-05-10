import {NextApiRequest, NextApiResponse} from "next";
import {getToken} from "next-auth/jwt";
import {swipeSchema} from "@lib/formdata";
import {toast} from "sonner";
import {prisma} from "@/prisma/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const token = await getToken({req});

    // Ensure token and user ID exist
    if (!token || !token.userId) {
        return res.status(401).json({message: "Unauthorized"});
    }

    switch (req.method) {
        case "POST":
            return swipe(req, res);
        default:
            return res.status(405).json({message: "Method not allowed"});
    }
}

async function swipe(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Validate the request body
        const validationResult = swipeSchema.safeParse(req.body);

        if (!validationResult.success) {
            toast.error("Validation errors:" + validationResult.error.format());
            return res.status(400).json({
                message: "Invalid request data",
                errors: validationResult.error.format()
            });
        }


        const {
            swiperId, swipedId, swipeRight
        } = validationResult.data;


        // check if person who got swipes is in db
        const swipedUser = await prisma.user.findUnique({
            where: {id: swipedId as string},
        });
        if (!swipedUser) {
            return res.status(404).json({message: `Swiped user ${swipedId} not found.`});
        }


        //TO DO: check if gender preferance match:


        // Create the swipes
        const newSwipe = await prisma.swipe.upsert({
            where: {
                swiperId_swipedId: {
                    swiperId,
                    swipedId,
                },
            },
            update: {
                swipeRight, // you can choose to update fields if needed
            },
            create: {
                swiperId,
                swipedId,
                swipeRight,
            },
        });
        let isMatch = false;
        let newMatch = {};

        if (swipeRight) {
            const existingSwipe = await prisma.swipe.findFirst({
                where: {
                    swiperId: swipedId as string,
                    swipedId: swiperId,
                    swipeRight: true,
                },
            });

            if (existingSwipe) {
                // Create a Match
                newMatch = await prisma.match.create({
                    data: {
                        firstUserId: swiperId,
                        secondUserId: swipedId as string,
                    },
                });
                if (newMatch) {
                    isMatch = true;
                }
            }
        }


        toast.success(isMatch ? "It's a match! 🎉" : "Swipe recorded.");
        return res.status(200).json({
            swipe: newSwipe,
            match: newMatch,
            isMatch: isMatch,
        });
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message); // Access the message safely
            return res.status(500).json({ message: error.message });
        } else {
            toast.error("An unknown error occurred");
            return res.status(500).json({ message: "An unknown error occurred" });
        }
    }
}
