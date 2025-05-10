// pages/api/studysession/index.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/prisma/prisma' // Make sure this path is correct!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const sessions = await prisma.studySession.findMany()
            return res.status(200).json(sessions)
        } catch {
            return res.status(500).json({ error: 'Error fetching sessions' })
        }
    }

    if (req.method === 'POST') {
        try {
            const { location, eventTime } = req.body

            if (!location || !eventTime) {
                return res.status(400).json({ error: 'Missing required fields' })
            }

            const session = await prisma.studySession.create({
                data: {
                    location,
                    eventTime: new Date(eventTime),
                },
            })

            return res.status(201).json(session)
        } catch {
            return res.status(500).json({ error: 'Error creating session' })
        }
    }

    return res.status(405).end() // Method not allowed
}
