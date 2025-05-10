"use client"

import React, {useEffect, useRef, useState} from 'react';
import {addDoc, collection, limit, onSnapshot, orderBy, query, Timestamp} from "firebase/firestore"
import db from "@lib/firestore"
import z from "zod";
import {TextBubbleRight} from "@components/ui/chatpage-ui/textBubbleRight";
import {TextBubbleLeft} from "@components/ui/chatpage-ui/textBubbleLeft";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@components/ui/dropdown-menu";
import {Loader2, Plus, Send, UsersIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import {Input} from "@components/ui/input";
import {Button} from "@components/ui/button";
import {toast} from "sonner";
import {useSession} from "next-auth/react";
import {getProfile} from "@lib/actions";
import {Sidebar} from "@components/ui/chatpage-ui/chatSideBar";
import {MatchProfile, MyProfile} from "@/app/types/chats";

// Message schema for type safety and validation
const messageSchema = z.object({
    userId: z.string().uuid(),
    message: z.string().min(1),
    createdAt: z.preprocess(
        (val) => {
            if (val instanceof Timestamp) {
                return val.toDate(); // convert Firestore Timestamp to JS Date
            }
            return val; // fallback, if it's already a Date or string
        },
        z.date()
    ),
});

type Message = z.infer<typeof messageSchema>;

export default function ChatPage() {
    const {data: session} = useSession();
    const router = useRouter();
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [chatName, setChatName] = useState<string | null>(null);
    const [matchProfiles, setMatchProfiles] = useState<MatchProfile[]>([]);
    const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const userId = session?.user?.userId as string;
    const [selectedMatchPath, setSelectedMatchPath] = useState<string | null>(null);

    const [noMatches, setNoMatches] = useState<boolean>(false);

// In your fetchMatches function, modify the error handling:
    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/matches');

                if (response.status === 404) {
                    // Handle the "No matches found" case specifically
                    setNoMatches(true);
                    setMatchProfiles([]);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch matches: ${response.statusText}`);
                }

                const data = await response.json();
                setNoMatches(false);
                setMatchProfiles(data);

                // Auto-select first match if available
                if (data.length > 0 && !selectedMatchPath) {
                    setSelectedMatchPath(`matches/chats/${data[0].matchId}`);
                    setChatName(data[0].name || "User");
                }
            } catch (error) {
                console.error("Error fetching matches:", error);
                setError("Failed to load your matches. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatches();
    }, [selectedMatchPath]);

    // Fetch messages when match is selected
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                if (!selectedMatchPath) return;

                setIsLoading(true);
                const matchRef = collection(db, selectedMatchPath);
                const q = query(matchRef, orderBy("createdAt", "desc"), limit(50));

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    setIsLoading(false);

                    if (snapshot.empty) {
                        setMessages([]);
                        return;
                    }

                    const fetchedMessages = snapshot.docs
                        .map(doc => {
                            const result = messageSchema.safeParse(doc.data());
                            return result.success ? result.data : null;
                        })
                        .filter((msg): msg is Message => msg !== null)
                        .reverse();

                    setMessages(fetchedMessages);

                    // Scroll to bottom when new messages arrive
                    setTimeout(() => {
                        bottomRef.current?.scrollIntoView({behavior: "smooth"});
                    }, 100);
                }, (error) => {
                    console.error("Error listening to messages:", error);
                    setIsLoading(false);
                    setError("Failed to load messages. Please try again.");
                });

                return unsubscribe;
            } catch (e) {
                console.error("Error in fetch messages:", e);
                setIsLoading(false);
                setError("Something went wrong loading messages.");
            }
        };

        fetchMessages();
    }, [selectedMatchPath]);

    // Fetch user profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;

            try {
                const data = await getProfile(userId);
                if (!data) {
                    throw new Error('Failed fetching profile');
                }
                setMyProfile(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    toast.error(err.message);
                } else {
                    toast.error('Something went wrong loading your profile');
                }
            }
        };

        fetchProfile();
    }, [userId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!messageInput.trim() || !selectedMatchPath) return;

        const messageToSend = messageSchema.safeParse({
            userId,
            message: messageInput.trim(),
            createdAt: new Date(),
        });

        if (!messageToSend.success) {
            console.error("Validation failed:", messageToSend.error);
            toast.error("Failed to send message");
            return;
        }

        try {
            setIsSubmitting(true);
            // Optimistically update UI
            setMessages(prev => [...prev, messageToSend.data]);
            setMessageInput("");

            // Focus back on input after sending
            inputRef.current?.focus();

            // Actually send to Firebase
            await addDoc(collection(db, selectedMatchPath), messageToSend.data);
        } catch (e) {
            console.error("Error sending message:", e);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMatchClick = (user: MatchProfile) => {
        setSelectedMatchPath(`matches/chats/${user.matchId}`);
        setChatName(user.name || "User");
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    };

    // Group messages by date
    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {};

        messages.forEach(msg => {
            const date = msg.createdAt.toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(msg);
        });

        return groups;
    };

    const messageGroups = groupMessagesByDate(messages);

    // Show loading state
    if (isLoading && !messages.length) {
        return (
            <div className="flex h-screen w-full">
                {/* Sidebar with loading state */}
                <div className="w-72 bg-gray-100 border-r animate-pulse">
                    <div className="p-4">
                        <div className="h-12 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main content loading state */}
                <div
                    className="flex flex-col h-[90vh] w-[850px] mx-auto mt-3 bg-gray-100 border border-gray-300 rounded-2xl">
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4"/>
                            <p className="text-gray-600">Loading messages...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    if (noMatches) {
        return (
            <div className="flex h-screen w-full">
                {/* Sidebar with minimal state */}
                <div className="w-72 bg-gray-100 border-r">
                    <div className="p-4">
                        <h2 className="text-xl font-semibold mb-4">Messages</h2>
                    </div>
                </div>

                {/* Main content - no matches state */}
                <div
                    className="flex flex-col h-[90vh] w-[850px] mx-auto mt-3 bg-gray-100 border border-gray-300 rounded-2xl">
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center text-center p-6 max-w-md">
                            <UsersIcon className="h-12 w-12 text-purple-600 mb-4"/>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">No matches yet</h2>
                            <p className="text-gray-600 mb-4">
                                You don&#39;t have any matches yet. Start swiping to connect with new people!
                            </p>
                            <Button onClick={() => router.push('/matches')}>
                                Find Matches
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // Show error state
    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Sidebar */}
            {matchProfiles && myProfile ? (
                <Sidebar
                    matchProfiles={matchProfiles}
                    myProfile={myProfile}
                    onClick={handleMatchClick}
                    activeMatchId={selectedMatchPath?.split('/').pop() || null}
                />
            ) : myProfile ? (
                <Sidebar
                    myProfile={myProfile}
                    onClick={handleMatchClick}
                    activeMatchId={selectedMatchPath?.split('/').pop() || null}
                />
            ) : (
                <div className="w-72 bg-gray-100 border-r p-4 flex items-center justify-center">
                    <p className="text-gray-500">No matches found</p>
                </div>
            )}

            {/* Chat Area */}
            <div
                className="flex flex-col h-[90vh] w-[850px] mx-auto mt-3 bg-gray-100 border border-gray-300 rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-t-2xl">
                    <h1 className="text-xl font-bold">{chatName || "Select a match to chat"}</h1>
                </div>

                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {!selectedMatchPath ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-lg">Select a match to start chatting</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-gray-500 text-lg mb-2">No messages yet</p>
                                <p className="text-gray-400">Say hello to start the conversation!</p>
                            </div>
                        </div>
                    ) : (
                        Object.entries(messageGroups).map(([date, msgs]) => (
                            <div key={date} className="space-y-4">
                                <div className="flex justify-center">
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {new Date(date).toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}
                  </span>
                                </div>

                                {msgs.map((msg, idx) => (
                                    msg.userId === userId ? (
                                        <div key={idx} className="flex flex-col items-end">
                                            <TextBubbleRight>
                                                {msg.message}
                                            </TextBubbleRight>
                                            <span className="text-xs text-gray-500 ml-2">
                                              {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div key={idx} className="flex flex-col items-start">
                                            <TextBubbleLeft>
                                                {msg.message}
                                            </TextBubbleLeft>
                                            <span className="text-xs text-gray-500 ml-2">
                                              {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                        ))
                    )}
                    <div ref={bottomRef}></div>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="mt-auto">
                    <div className="flex items-center p-4 bg-white border-t rounded-b-2xl">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-500">
                                    <Plus className="w-6 h-6"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="top">
                                <DropdownMenuItem className="text-lg py-2"
                                                  onClick={() => handleNavigation('/calendar')}>
                                    📚 Study Buddy Mode
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-lg py-2"
                                                  onClick={() => window.open('https://events.sjsu.edu/calendar')}>🏫
                                    Campus Social Events</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Input
                            ref={inputRef}
                            onChange={(e) => setMessageInput(e.target.value)}
                            value={messageInput}
                            placeholder={selectedMatchPath ? "Type a message..." : "Select a match to chat"}
                            className="flex-grow mx-2 h-12 text-lg"
                            disabled={!selectedMatchPath || isSubmitting}
                        />

                        <Button
                            type="submit"
                            className="h-12 px-4"
                            disabled={!messageInput.trim() || !selectedMatchPath || isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin"/>
                            ) : (
                                <Send className="h-5 w-5"/>
                            )}
                            <span className="ml-2">Send</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}