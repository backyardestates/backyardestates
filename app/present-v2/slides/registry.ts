import type { ComponentType } from "react";

import { Slide1_Cover } from "./Slide1_Cover";
import { Slide2_YourProperty } from "./Slide2_YourProperty";
import { Slide3_YourOptions } from "./Slide3_YourOptions";
import { Slide4_WhatsIncluded } from "./Slide4_WhatsIncluded";
import { Slide5_CompletedBuilds } from "./Slide5_CompletedBuilds";
import { Slide6_CustomerStories } from "./Slide6_CustomerStories";
import { Slide7_HowItWorks } from "./Slide7_HowItWorks";
import { Slide8_ROIComparison } from "./Slide8_ROIComparison";
import { Slide9_ADUvsHouse } from "./Slide9_ADUvsHouse";
import { Slide10_RentalAnalysis } from "./Slide10_RentalAnalysis";
import { Slide11_WhatsNext } from "./Slide11_WhatsNext";
import { Slide12_OurTeam } from "./Slide12_OurTeam";
import { Slide12_TaxBenefits } from "./Slide12_TaxBenefits";
import { Slide13_WhyBE } from "./Slide13_WhyBE";
import { Slide14_PaymentSchedule } from "./Slide14_PaymentSchedule";

export interface V2SlideEntry {
    /** Slide number used by `slideOrder` and the presenter (1-based). */
    n: number;
    name: string;
    Component: ComponentType;
}

// Single source of truth for the v2 deck — used by the presenter (PresentClient),
// the print/export view (PrintClient), and the admin slide-order panel. Index 0 =
// slide 1. Slides 1–14 are the reorderable flow; slide 15 (Why Backyard Estates)
// is jump-only. Note the intentional file-name/position offsets (slide 3 renders
// Slide4_WhatsIncluded, slide 4 renders Slide3_YourOptions, etc.).
export const V2_SLIDES: V2SlideEntry[] = [
    { n: 1, name: "Cover", Component: Slide1_Cover },
    { n: 2, name: "Your Property", Component: Slide2_YourProperty },
    { n: 3, name: "What's Included", Component: Slide4_WhatsIncluded },
    { n: 4, name: "Your Options", Component: Slide3_YourOptions },
    { n: 5, name: "Completed Builds", Component: Slide5_CompletedBuilds },
    { n: 6, name: "Customer Stories", Component: Slide6_CustomerStories },
    { n: 7, name: "How It Works", Component: Slide7_HowItWorks },
    { n: 8, name: "ROI Comparison", Component: Slide8_ROIComparison },
    { n: 9, name: "ADU vs House", Component: Slide9_ADUvsHouse },
    { n: 10, name: "Rental Analysis", Component: Slide10_RentalAnalysis },
    { n: 11, name: "Payment Schedule", Component: Slide14_PaymentSchedule },
    { n: 12, name: "Tax Topics", Component: Slide12_TaxBenefits },
    { n: 13, name: "Our Team", Component: Slide12_OurTeam },
    { n: 14, name: "What's Next", Component: Slide11_WhatsNext },
    { n: 15, name: "Why Backyard Estates", Component: Slide13_WhyBE },
];

/** Number of slides in the reorderable presenter flow (15 is jump-only). */
export const V2_FLOW_COUNT = 14;
