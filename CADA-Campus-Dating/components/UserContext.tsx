// components/UserContext.tsx
"use client";
import React, { createContext, useContext } from "react";

export const UserContext = createContext<{ userId: string | null }>({ userId: null });

export const useUser = () => useContext(UserContext);

export const UserProvider = ({
                                 userId,
                                 children,
                             }: {
    userId: string;
    children: React.ReactNode;
}) => {
    return <UserContext.Provider value={{ userId }}>{children}</UserContext.Provider>;
};
