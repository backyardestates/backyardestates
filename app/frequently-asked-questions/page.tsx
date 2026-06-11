import { PortableText, type SanityDocument } from 'next-sanity'

import { client } from '@/sanity/client'

import Faq from '@/components/Faq'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import JsonLd from '@/components/JsonLd'

import style from './page.module.css'
import AttentionCTA from '@/components/AttentionCTA'
import { buildMetadata } from '@/lib/seo'
import { faqSchema } from '@/lib/jsonLd'

export const metadata = buildMetadata({
  title: 'ADU Frequently Asked Questions',
  description:
    'Answers to the most common questions about building an ADU (accessory dwelling unit) with Backyard Estates — cost, financing, timeline, permitting, and what is included.',
  path: '/frequently-asked-questions',
})

const FAQS_QUERY = `*[_type == "faq"]|order(publishedAt asc){_id, title, body, publishedAt}`

const options = { next: { revalidate: 30 } }

export default async function FrequentlyAskedQuestions() {
  const faqs = await client.fetch<SanityDocument[]>(FAQS_QUERY, {}, options)

  // Flatten PortableText answers to plain text for the FAQPage schema.
  const faqLd = faqSchema(
    faqs.map((faq) => ({
      question: faq.title,
      answer: Array.isArray(faq.body)
        ? faq.body
            .map((block: any) =>
              Array.isArray(block.children)
                ? block.children.map((child: any) => child.text).join('')
                : ''
            )
            .join('\n')
        : '',
    }))
  )
  return (
    <>
      <Nav />
      <Masthead title="Frequently asked questions" explanation="" />
      <main className={style.main}>
        <div className={style.content}>
          <div className={style.faqs}>
            {faqs.map((faq, index) => (
              <Faq
                key={index}
                question={faq.title}
                cta={{
                  label: 'Still curious? Ask an ADU specialist',
                  href: '/talk-to-an-adu-specialist',
                }}
              >
                {Array.isArray(faq.body) && (
                  <PortableText value={faq.body} />
                )}
                <p className={style.date}>
                  Updated:
                  {new Date(
                    faq.publishedAt
                  ).toLocaleDateString()}
                </p>
              </Faq>
            ))}
          </div>
        </div>

        <AttentionCTA
          eyebrow="Get Started"
          title="Start your ADU journey today"
          description="Expand your income and livable space with a thoughtfully designed ADU. Our team handles everything — from feasibility to final build."
          primaryLabel="Talk to an ADU Specialist"
          primaryHref="/talk-to-an-adu-specialist"
          secondaryText="Or call (909) 500-0917"
          secondaryHref="tel:+19095000917"
        />
      </main>
      <Footer />

      <JsonLd data={faqLd} />
    </>
  )
}

/*

import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import Link from "next/link";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await client.fetch<SanityDocument>(POST_QUERY, params, options);
  const postImageUrl = post.image
    ? urlFor(post.image)?.width(550).height(310).url()
    : null;

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
      <Link href="/" className="hover:underline">
        ← Back to posts
      </Link>
      {postImageUrl && (
        <img
          src={postImageUrl}
          alt={post.title}
          className="aspect-video rounded-xl"
          width="550"
          height="310"
        />
      )}
      <h1 className="text-4xl font-bold mb-8">{post.title}</h1>
      <div className="prose">
        <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>
    </main>
  );
}
*/
