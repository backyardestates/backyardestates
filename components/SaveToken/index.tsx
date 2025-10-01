'use client'
import { useEffect } from "react";

export function SaveToken({ token }: { token: string }) {
    useEffect(() => {
        localStorage.setItem("checkinToken", token);
    }, [token]);

    return null;
}
