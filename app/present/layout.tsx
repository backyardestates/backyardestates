import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./styles/present.design.css";

const inter = Inter({
    subsets: ["latin"],
    weight: ["200", "300", "400", "500", "600", "700"],
    display: "swap",
    variable: "--font-inter",
});

const fraunces = Fraunces({
    subsets: ["latin"],
    style: ["italic", "normal"],
    display: "swap",
    variable: "--font-fraunces",
    axes: ["opsz"],
});

export const metadata: Metadata = {
    title: "Backyard Estates — Presentation",
    description: "ADU Investment Proposal",
};

export default function PresentLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={`${inter.variable} ${fraunces.variable}`}
            style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#0d1f1f" }}
        >
            {children}
        </div>
    );
}
