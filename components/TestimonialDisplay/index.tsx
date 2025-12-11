"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./TestimonialDisplay.module.css";

/* ----------------------------
   TYPES
----------------------------- */

interface Span {
    _key: string;
    _type: "span";
    text: string;
    marks?: string[];
}

interface Block {
    _key: string;
    _type: "block";
    style: "normal" | "blockquote";
    children: Span[];
}

interface Portrait {
    url: string;
}

export interface Testimonial {
    names: string;
    portrait?: Portrait;
    body: Block[];
}

interface TestimonialProps {
    testimonial?: Testimonial | null;
}

/* ----------------------------
   COMPONENT
----------------------------- */
export default function TestimonialDisplay({ testimonial }: TestimonialProps) {
    if (!testimonial) return null;

    const { names, portrait, body } = testimonial;

    const [expanded, setExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState("260px");

    useEffect(() => {
        if (contentRef.current) {
            setMaxHeight(
                expanded ? `${contentRef.current.scrollHeight}px` : "260px"
            );
        }
    }, [expanded]);

    return (
        <section className={styles.wrapper}>
            {/* LEFT COLUMN — desktop/tablet */}
            <div className={styles.leftColumn}>
                <div className={`${styles.portraitWrapper} ${styles.desktopPortrait}`}>
                    <Image
                        src={portrait?.url || "/placeholder.svg"}
                        alt={names}
                        width={200}
                        height={200}
                        className={styles.portrait}
                    />
                </div>

                <h2 className={styles.name}>{names}</h2>
                <p className={styles.role}>HOMEOWNER</p>
            </div>

            {/* RIGHT COLUMN — includes mobile portrait */}
            <div className={styles.rightColumn}>
                {/* TEXT BODY */}
                <div className={styles.bodyContainer} style={{ maxHeight }}>
                    <div ref={contentRef} className={styles.bodyInner}>

                        {/* MOBILE portrait flowing inside text */}
                        <div className={styles.mobilePortraitContainer}>
                            <div className={styles.portraitWrapper}>
                                <Image
                                    src={portrait?.url || "/placeholder.svg"}
                                    alt={names}
                                    width={120}
                                    height={120}
                                    className={styles.portrait}
                                />
                            </div>

                            <h2 className={styles.name}>{names}</h2>
                            <p className={styles.role}>HOMEOWNER</p>
                        </div>

                        {/* Mobile portrait ends — text begins */}
                        {body.map((block) => {
                            const html = block.children
                                .map((child) =>
                                    child.marks?.includes("strong")
                                        ? `<strong>${child.text}</strong>`
                                        : child.text
                                )
                                .join("");

                            return block.style === "blockquote" ? (
                                <blockquote
                                    key={block._key}
                                    className={styles.blockquote}
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            ) : (
                                <p
                                    key={block._key}
                                    className={styles.paragraph}
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            );
                        })}
                    </div>

                    {!expanded && <div className={styles.fadeOverlay} />}
                </div>


                {/* Expand / Collapse */}
                <button
                    className={styles.expandButton}
                    onClick={() => setExpanded((prev) => !prev)}
                >
                    {expanded ? "Read less" : "Read more"}
                </button>
            </div>
        </section>
    );
}
