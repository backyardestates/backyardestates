import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./styles/present.design.css";

const outfit = Outfit({
    subsets: ["latin"],
    weight: ["200", "300", "400", "500", "600"],
    display: "swap",
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: "Backyard Estates — Presentation",
    description: "ADU Investment Proposal",
};

export default function PresentLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={outfit.variable}
            style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "var(--p-dark, #0d1f1f)", cursor: "none" }}
        >
            {children}
        </div>
    );
}
