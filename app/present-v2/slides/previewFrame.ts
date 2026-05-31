import { Inter, Fraunces } from "next/font/google";
// Load the v2 design tokens (--p-* colors, --p-font, utility classes) so slides
// rendered OUTSIDE the presenter — the admin slide-order thumbnails — match the
// real deck's colors/contrast. Safe to import here: the bleeding html/body reset
// now lives in present.reset.css (presenter layout only), not in this token sheet.
import "../styles/present.design.css";

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

/**
 * Class names that establish the Inter/Fraunces font variables the v2 slides
 * resolve through `--p-font`. Apply to the element wrapping a previewed slide.
 */
export const slidePreviewFontVars = `${inter.variable} ${fraunces.variable}`;
