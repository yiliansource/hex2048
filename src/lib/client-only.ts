"use client";

import { useEffect, useState } from "react";

export const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    return isClient;
};

export const ClientOnly = ({
    server,
    children,
}: {
    server?: React.ReactNode;
    children: React.ReactNode;
}) => {
    const isClient = useIsClient();
    return isClient ? children : server;
};
