"use client";

import { usePresentationStore } from "@/lib/store/presentationStore";

function parseLastName(fullName: string): string {
    const trimmed = fullName.trim();
    if (!trimmed) return "—";
    const parts = trimmed.split(/\s+/);
    return parts[parts.length - 1].toUpperCase();
}

function parseCity(address: string): string {
    if (!address) return "";
    const parts = address.split(",");
    if (parts.length >= 2) return parts[parts.length - 2].trim().toUpperCase();
    return "";
}

type Props = {
    slideNumber: number;
    topic: string;
    theme: "dark" | "light";
};

export function RunningHeader({ slideNumber, topic, theme }: Props) {
    const { customerName, propertyAddress } = usePresentationStore();
    const lastName = parseLastName(customerName);
    const city = parseCity(propertyAddress);
    const left = city ? `${lastName} · ${city}` : lastName;

    return (
        <div className={`running-header running-header-${theme}`}>
            <span className="running-header-left">{left}</span>
            <span className="running-header-center">{topic}</span>
            <span className="running-header-right">
                {String(slideNumber).padStart(2, "0")}
                <span className="running-header-slide-num"> / 10</span>
            </span>
        </div>
    );
}
