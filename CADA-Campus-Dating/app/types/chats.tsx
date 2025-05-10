
export type MatchProfile = {
    matchId: string;
    avatar: string;
    name: string;
    latestMessage: string;
    createdAt: string;
    unread?: number;
};

export type MyProfile = {
    avatar: string | null;
    preferredName?: string | null;
};

export type SidebarProps = {
    matchProfiles?: MatchProfile[] | null;
    myProfile: MyProfile;
    onClick?: (user: MatchProfile) => void;
    activeMatchId?: string | null;
};