// Shared helpers for "featured rentals" identity + conversion.
//
// Kept identical to the originals in FeatureRentalsPanel so a rental toggled
// from the comps list (RentalsPanel) matches the same item in the featured
// editor. RentalsPanel and AdminMasterClient import these; FeatureRentalsPanel
// keeps its own copies untouched to avoid any behavioral risk.

import type { RentalListing } from "@/lib/rentcast/types";
import type { FeaturedRental } from "@/lib/store/presentationStore";

export function rentalKey(
    r: Pick<FeaturedRental, "formattedAddress" | "price" | "squareFootage" | "bedrooms" | "bathrooms">,
): string {
    return [
        (r.formattedAddress ?? "").trim().toLowerCase(),
        r.price ?? "",
        r.squareFootage ?? "",
        r.bedrooms ?? "",
        r.bathrooms ?? "",
    ].join("|");
}

export function toFeatured(r: RentalListing): FeaturedRental {
    return {
        formattedAddress: r.formattedAddress,
        price: r.price,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        squareFootage: r.squareFootage,
        propertyType: r.propertyType,
        listedDate: r.listedDate,
        lastSeenDate: r.lastSeenDate,
    };
}
