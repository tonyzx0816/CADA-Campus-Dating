import React from 'react';
import Image from "next/image";
import {Avatar, AvatarFallback, AvatarImage} from "@components/ui/avatar";
import {ScrollArea, ScrollBar} from "@components/ui/scroll-area";
import {Separator} from "@components/ui/separator";
import {Badge} from "@components/ui/badge";
import {SidebarProps} from "@/app/types/chats";


export const Sidebar = ({matchProfiles, myProfile, onClick}: SidebarProps) => {
    return (
        <div className="w-[400px] border-r p-4 overflow-y-auto">
            {/* Logo + User Info */}
            <div className="items-center gap-2 mb-2">
                <Image src="/cada_heart.png" alt="Heart" width={48} height={48} className="w-12 h-12"/>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Avatar>
                    <AvatarImage src={myProfile?.avatar || undefined}/>
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold">
                        {myProfile?.preferredName ?? "Loading..."}
                    </h1>
                    <p className="text-sm text-gray-500">Now Active</p>
                </div>
            </div>

            {/* Horizontal Avatars */}
            <ScrollArea className="mb-4">
                <div className="flex space-x-4 pb-2">
                    {
                        (matchProfiles && matchProfiles.length > 0)
                            ?
                            (matchProfiles).map((user, i) => (
                                <div key={i} className="relative" onClick={() => onClick?.(user)}>
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={user.avatar}/>
                                        <AvatarFallback>T</AvatarFallback>
                                    </Avatar>
                                    <span
                                        className="absolute bottom-0 right-0 h-3 w-3 bg-purple-500 rounded-full border-2 border-white"/>
                                </div>
                            ))

                            : <></>

                    }
                </div>
                <ScrollBar orientation="horizontal"/>
            </ScrollArea>

            <Separator className="mb-4"/>

            {/* Chat Previews */}
            <div className="space-y-4">
                {
                    (matchProfiles && matchProfiles.length > 0)
                        ?
                        (matchProfiles).map((user, i) => (
                                <div key={i} className="flex justify-between items-start" onClick={() => onClick?.(user)}>
                                    <div className="flex gap-3 items-start">
                                        <Avatar>
                                            <AvatarImage src={user.avatar}/>
                                            <AvatarFallback>T</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h2 className="font-semibold">{user.name}</h2>
                                            <p className="text-sm text-gray-600 truncate max-w-[160px]">
                                                {user.latestMessage}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className="text-xs text-gray-400">{user.createdAt}</p>
                                        {user.unread && (
                                            <Badge
                                                className="rounded-full bg-purple-600 text-white h-5 w-5 p-0 text-xs flex items-center justify-center">
                                                {user.unread}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )
                        ) : <></>}
            </div>
        </div>
    );
};
