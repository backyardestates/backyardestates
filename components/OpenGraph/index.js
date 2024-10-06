import Head from 'next/head'

export default function OpenGraph({
    title = 'Backyard Estates',
    description = 'Backyard Estates - Premier Accessory Dwelling Unit (ADU) builder for the greater Los Angeles area.',
    image = 'backyard-estates-OG.png',
    domain = 'backyardestates.com',
}) {
    const url = 'https://www.backyardestates.com/'

    return (
        <Head>
            <meta name="description" content={description} key="desc" />

            {/* Open Graph */}
            <meta property="og:url" content={url} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={`${url}images/og/${image}`} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="twitter:domain" content={domain} />
            <meta property="twitter:url" content={url} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={`${url}images/og/${image}`} />
        </Head>
    )
}
