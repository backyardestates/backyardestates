"use client";

import React from "react";
import { REP_CONFIG } from "@/lib/config/repConfig";

export function BeHouseLogo({ size = 36, color }: { size?: number; color?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color }}
        >
            <path
                d="M4 14L16 4l12 10v14H4V14z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M12 28v-8h8v8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

type Props = {
    pageNum: number;
    pageTotal?: number;
    disclaimer?: string;
};

export function ProposalFooter({ pageNum, pageTotal = 10, disclaimer }: Props) {
    return (
        <div className="proposal-footer">
            <span className="proposal-footer-disclaimer">
                {disclaimer ?? `${REP_CONFIG.company}  ·  ${REP_CONFIG.phone}  ·  ${REP_CONFIG.email}`}
            </span>
            <div className="proposal-footer-right">
                <span className="proposal-footer-page">Page {pageNum} / {pageTotal}</span>
                <BeHouseLogo size={36} />
            </div>
        </div>
    );
}
