// Renders one or more schema.org JSON-LD objects into a <script> tag.
// Server component — emits nothing visible. Pass a single object or an array.
//
//   <JsonLd data={productSchema(floorplan)} />
//   <JsonLd data={[localBusinessSchema(), faqSchema(faqs)]} />

type JsonLdProps = {
    data: Record<string, unknown> | Record<string, unknown>[]
}

export default function JsonLd({ data }: JsonLdProps) {
    const items = Array.isArray(data) ? data : [data]
    return (
        <>
            {items.map((item, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    // Schema is our own structured data; escape "<" defensively so
                    // a stray value can't break out of the <script> element.
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(item).replace(/</g, '\\u003c'),
                    }}
                />
            ))}
        </>
    )
}
