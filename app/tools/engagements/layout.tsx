import { Inter, Fraunces } from "next/font/google";

// Match the v2 presenter deck's type system across the engagements surface so
// the pipeline reads like the rest of the brand: Inter for UI, Fraunces italic
// for editorial accents. (Same loading as app/tools/fpa/layout.tsx.)
const inter = Inter({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
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

export default function EngagementsLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${inter.variable} ${fraunces.variable}`}>{children}</div>;
}
