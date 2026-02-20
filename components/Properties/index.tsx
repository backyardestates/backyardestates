import { client } from "@/sanity/client";
import { type SanityDocument } from "next-sanity";

import StandaloneLink from "../StandaloneLink";
import style from "./Properties.module.css";

import { PROPERTIES_QUERY } from "@/sanity/queries";
import PropertyCard from "../PropertyCard";
import SoftCTA from "../SoftCTA";

const options = { next: { revalidate: 30 } };

export default async function Properties() {
    const properties = await client.fetch<SanityDocument[]>(
        PROPERTIES_QUERY,
        {},
        options
    );

    const completedNewProperties = properties.filter((p: any) => p.completed === true);

    const label = "REAL PROJECTS. REAL FAMILIES.";
    const headline = "From Backyard to Beautiful Living.";
    const subheadline =
        "Thoughtfully designed, efficiently built for families like yours, and delivered exactly as promised.";

    return (
        <section className={style.base} aria-label="Recent completed ADUs">
            {/* Intro */}
            <div className={style.intro}>
                <p className={`${style.label} ${style.fadeInUp}`}>{label}</p>

                <header
                    className={`${style.header} ${style.fadeInUp}`}
                    style={{ animationDelay: "60ms" }}
                >
                    <h2 className={style.h2}>{headline}</h2>
                    <p className={style.subhead}>{subheadline}</p>
                </header>
            </div>

            {/* Grid */}
            <div className={style.properties}>
                {completedNewProperties.map((property, index) => (
                    <PropertyCard key={property?._id ?? index} content={property} />
                ))}
            </div>

            {/* CTA */}
            {/* <div className={style.centered}> */}
            <SoftCTA linkText="See our completed ADUs" href="/properties" />
            {/* </div> */}
        </section>
    );
}
