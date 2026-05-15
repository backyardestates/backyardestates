"use client";

import React from "react";

type IconProps = {
    size?: number;
    className?: string;
    stroke?: number;
};

const base = (size: number, stroke: number) => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
});

export function IconBolt({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
    );
}

export function IconSnowflake({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
    );
}

export function IconDroplet({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <path d="M12 2.5C8 7 5 10.5 5 14.5c0 3.866 3.134 7 7 7s7-3.134 7-7c0-4-3-7.5-7-12z" />
        </svg>
    );
}

export function IconFrame({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <rect x="3" y="6" width="18" height="14" rx="1" />
            <path d="M3 10h18" />
            <path d="M9 6V3" />
            <path d="M15 6V3" />
        </svg>
    );
}

export function IconClipboard({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <rect x="5" y="4" width="14" height="17" rx="1.5" />
            <path d="M9 4V2.5h6V4" />
            <path d="M9 11h6" />
            <path d="M9 15h4" />
        </svg>
    );
}

export function IconUsers({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M15 20c0-2.5 2-4.5 4-4.5" />
        </svg>
    );
}

export function IconCoin({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5" />
            <path d="M9 14.5c0 1.4 1.3 2.5 3 2.5s3-1.1 3-2.5c0-1.4-1.3-2-3-2.5s-3-1.1-3-2.5" />
            <line x1="12" y1="5" x2="12" y2="7" />
            <line x1="12" y1="17" x2="12" y2="19" />
        </svg>
    );
}

export function IconBank({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <path d="M3 9L12 3l9 6" />
            <line x1="3" y1="11" x2="21" y2="11" />
            <line x1="3" y1="21" x2="21" y2="21" />
            <line x1="6" y1="11" x2="6" y2="19" />
            <line x1="10" y1="11" x2="10" y2="19" />
            <line x1="14" y1="11" x2="14" y2="19" />
            <line x1="18" y1="11" x2="18" y2="19" />
        </svg>
    );
}

export function IconTrendUp({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <polyline points="3,17 9,11 13,15 21,7" />
            <polyline points="15,7 21,7 21,13" />
        </svg>
    );
}

export function IconPlay({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <circle cx="12" cy="12" r="10" />
            <polygon points="10,8 16,12 10,16" fill="currentColor" />
        </svg>
    );
}

export function IconPhone({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    );
}

export function IconEnvelope({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
            <polyline points="3,7 12,14 21,7" />
        </svg>
    );
}

export function IconCheck({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <polyline points="4,12 10,18 20,7" />
        </svg>
    );
}

export function IconX({ size = 28, className, stroke = 1.5 }: IconProps) {
    return (
        <svg {...base(size, stroke)} className={className}>
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
    );
}
