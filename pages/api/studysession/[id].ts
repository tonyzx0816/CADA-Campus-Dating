// pages/api/studysession/[id].ts

import { prisma } from '@/prisma/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {
        query: { id },
        method,
    } = req

    if (method === 'PUT') {
        try {
            const { location, eventTime } = req.body
            if (!location || !eventTime) {
                return res.status(400).json({ error: 'Missing required fields' })
            }

            const updated = await prisma.studySession.update({
                where: { id: id as string },
                data: {
                    location,
                    eventTime: new Date(eventTime),
                },
            })

            return res.status(200).json(updated) // ✅ THIS is needed
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'Failed to update session' })
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' })
    }
}
