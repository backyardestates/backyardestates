import { Inter, Fraunces } from "next/font/google";

// Match the v2 presenter deck's type system on the FPA tool so the architect's
// surface reads like the rest of the brand: Inter for UI, Fraunces italic for
// editorial section accents.
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

export default function FpaLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${inter.variable} ${fraunces.variable}`}>{children}</div>;
}
