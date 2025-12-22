// types/property.ts

export interface PropertyPhoto {
    url: string;
    alt?: string;
}

export interface Testimonial {
    wistiaId: string;
    portrait?: { url: string };
    names?: string;
    quote?: string;
    body?: any[];
}

export interface TimelineRange {
    start?: string;
    end?: string;
}

export interface ConstructionItem {
    week: number;
    milestone: string;
    weekImage?: { url: string; alt?: string };
}

export interface Property {
    walkthroughVideo?: string | null;
    testimonial?: Testimonial | null;
    slug?: string;
    photos?: PropertyPhoto[];

    bed?: number;
    bath?: number;
    sqft?: number;
    aduType?: string;

    address?: {
        street?: string;
        unit?: string;
        city?: string;
        state?: string;
        zip?: string;
    };

    planningTimeline?: TimelineRange;
    permittingTimeline?: TimelineRange;
    constructionTimeline?: ConstructionItem[];

    extraSiteWork?: string[];
    extraFaqs?: any[];

    customerSelections?: any;

    // include other fields if needed
}