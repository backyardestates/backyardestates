// lib/rentcast/types.ts

export type Floorplan = {
    _id: string;
    name: string;
    sqft: number;
    price: number;
};

export type PropertyRecord = {
    formattedAddress?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: number;
    yearBuilt?: number;
    lastSaleDate?: string;
    lastSalePrice?: number;
    zoning?: string;
    assessorID?: string;
};

export type AvmValue = {
    price?: number;
    priceRangeLow?: number;
    priceRangeHigh?: number;
    subjectProperty?: {
        city?: string;
        state?: string;
        squareFootage?: number;
        propertyType?: string;
        yearBuilt?: number;
        lotSize?: number;
        bedrooms?: number;
        bathrooms?: number;
        lastSaleDate?: string;
        lastSalePrice?: number;
    };
    comparables?: Array<{
        formattedAddress?: string;
        price?: number;
        squareFootage?: number;
        distance?: number;
        correlation?: number;
        lastSeenDate?: string;
    }>;
};

export type RentalListing = {
    formattedAddress?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    propertyType?: string;
    listedDate?: string;
    lastSeenDate?: string;
    daysOnMarket?: number;
    status?: string;
};
