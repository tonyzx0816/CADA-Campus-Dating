'use client'

import 'react-big-calendar/lib/css/react-big-calendar.css'



import { useState, useEffect } from 'react';

interface Event {
    id: string;
    title: string;
    location: string;
    eventTime: string;
    createdBy: string;
}

const ev: Event[] = [
    {
        id: "1",
        title: "📚 Study Session: South Asian History Homework Help",
        location: "Dr. Martin Luther King Jr Library, DiNapoli Gallery - Second Floor",
        eventTime: "2025-05-04T10:00:00",
        createdBy: "Anjali P. (History 15A)"
    },
    {
        id: "2",
        title: "🎨 AAPI Studies Group Discussion & Study Hangout",
        location: "Dr. Martin Luther King Jr Library, 5th Floor - AAACNA Center",
        eventTime: "2025-05-04T10:00:00",
        createdBy: "Ming L. (Asian Am 1)"
    },
    {
        id: "3",
        title: "⚾ Stats & Probability Homework Near the Baseball Game",
        location: "San Jose, Calif.",
        eventTime: "2025-05-04T12:05:00",
        createdBy: "Carlos R. (Math 161)"
    },
    {
        id: "4",
        title: "🎶 Music Theory Cram Session Before the Recital",
        location: "Music Building, Concert Hall",
        eventTime: "2025-05-04T13:30:00",
        createdBy: "Sofia M. (MUSC 10B)"
    },
    {
        id: "5",
        title: "👥 Group Review: Western Music History",
        location: "Music Building, Concert Hall",
        eventTime: "2025-05-04T15:30:00",
        createdBy: "Zoe (Music Majors)"
    },
    {
        id: "6",
        title: "📖 Music Performance & Voice Technique Study Circle",
        location: "Music Building, Concert Hall",
        eventTime: "2025-05-04T17:30:00",
        createdBy: "Austin Z."
    },
    {
        id: "7",
        title: "🎺 Study & Practice: Brass Techniques and Theory",
        location: "Music Building, Concert Hall",
        eventTime: "2025-05-04T19:45:00",
        createdBy: "Juan Luis A."
    }
];

export default function StudySessionCards() {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // const res = await fetch('/api/studysession');
            // const data = await res.json();
            setEvents(ev);
        } catch (error) {
            console.error('Failed to fetch study sessions', error);
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
                <div key={event.id} className="border rounded-xl p-4 shadow-md hover:shadow-lg transition">
                    <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                    <p className="text-gray-600 mb-1">📍 {event.location}</p>
                    <p className="text-gray-600 mb-1">🗓 {new Date(event.eventTime).toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">Created by: {event.createdBy}</p>
                </div>
            ))}
        </div>
    );
}



