import { PortableText, type SanityDocument } from 'next-sanity'

import { client } from '@/sanity/client'

import type { Metadata } from 'next'

import Catchall from '@/components/Catchall'
import Faq from '@/components/Faq'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'

import style from './page.module.css'

export const metadata: Metadata = {
    title: 'FAQs - Backyard Estates',
    description: '',
}

const FAQS_QUERY = `*[_type == "faq"]|order(publishedAt asc){_id, title, body, publishedAt}`

const options = { next: { revalidate: 30 } }

export default async function FrequentlyAskedQuestions() {
    const faqs = await client.fetch<SanityDocument[]>(FAQS_QUERY, {}, options)
    return (
        <>
            <Nav />
            <Masthead title="Frequently asked questions" explanation="" />
            <main className="centered">
                <div className={style.content}>
                    <div className={style.faqs}>
                        {faqs.map((faq, index) => (
                            <Faq key={index} question={faq.title}>
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

                <Catchall />
            </main>
            <Footer />
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
