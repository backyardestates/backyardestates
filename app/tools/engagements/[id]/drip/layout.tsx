import { Inter, Fraunces } from "next/font/google";

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

export default function DripLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${inter.variable} ${fraunces.variable}`}>{children}</div>;
}
