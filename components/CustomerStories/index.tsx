// 'use client'
'use client'

import { useRef } from 'react'
import { gsap } from 'gsap/dist/gsap'
import { TextPlugin } from 'gsap/dist/TextPlugin'
import { useGSAP } from '@gsap/react'
import Button from '../Button'
// import style from './Hero.module.css'

gsap.registerPlugin(TextPlugin)

import style from './CustomerStories.module.css'

// import { Card, CardContent } from '@/components/ui/card'
// import {
//     Carousel,
//     CarouselContent,
//     CarouselItem,
//     CarouselNext,
//     CarouselPrevious,
// } from '@/components/ui/carousel'
// import { Badge } from '@/components/ui/badge'
// import { Star, Heart, ShoppingCart } from 'lucide-react'
// import Image from 'next/image'

export default function CustomerStories() {
    const stories = [
        {
            id: 1,
            title: 'One',
            image: '/placeholder.svg?height=225&width=400',
        },
        {
            id: 2,
            title: 'Two',
            image: '/placeholder.svg?height=225&width=400',
        },
        {
            id: 3,
            title: 'Three',
            image: '/placeholder.svg?height=225&width=400',
        },
        {
            id: 4,
            title: 'Four',
            image: '/placeholder.svg?height=225&width=400',
        },
        {
            id: 5,
            title: 'Five',
            image: '/placeholder.svg?height=225&width=400',
        },
    ]

    const phrases = [
        'bring parents closer',
        'house family members',
        'generate rental income',
        'create a hobby studio',
        'create an office',
    ]

    const titleRef = useRef(null)
    const phraseRef = useRef(null)
    const cursorRef = useRef(null)

    useGSAP(
        () => {
            gsap.to(cursorRef.current, {
                opacity: 0,
                repeat: -1,
                yoyo: true,
                duration: 0.5,
                ease: 'power2.inOut',
            })

            let masterTimeline = gsap.timeline({ repeat: -1 })

            phrases.forEach((phrase) => {
                let textTimeline = gsap.timeline({
                    repeat: 1,
                    yoyo: true,
                    repeatDelay: 2,
                })
                textTimeline.to(phraseRef.current, {
                    duration: 2,
                    text: phrase,
                })
                masterTimeline.add(textTimeline, '>1')
            })
        },
        { scope: titleRef }
    )

    return (
        <div className={style.base}>
            <div className={style.content}>
                {stories.map((story) => (
                    <div
                        key={story.id}
                        className={story.id === 3 ? style.video : style.item}
                    >
                        <p>{story.title}</p>
                    </div>
                ))}
            </div>
            <div className={style.bottom}>
                <h1 ref={titleRef}>
                    <span className={style.title}>Build an ADU to</span>
                    <span ref={phraseRef}></span>
                    <span ref={cursorRef}>_</span>
                </h1>
                <Button href="/talk-to-an-adu-specialist">
                    Talk to an ADU specialist
                </Button>
                <p className={style.small_caps}>
                    premier adu builder
                    <br />
                    <span>Los Angeles county</span>
                </p>
            </div>
            {/* <Carousel
                opts={{
                    align: 'start',
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {products.map((product) => (
                        <CarouselItem
                            key={product.id}
                            className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                        >
                            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-0">
                                    <div className="relative">
                                        <Image
                                            src={
                                                product.image ||
                                                '/placeholder.svg'
                                            }
                                            alt={product.title}
                                            width={400}
                                            height={225}
                                            className="w-full aspect-video object-cover rounded-t-lg"
                                        />
                                        <Badge
                                            variant="secondary"
                                            className="absolute top-3 left-3 bg-orange-500 text-white hover:bg-orange-600"
                                        >
                                            {product.badge}
                                        </Badge>
                                        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                                            <Heart className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                                            {product.title}
                                        </h3>

                                        <div className="flex items-center gap-1 mb-3">
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${
                                                            i <
                                                            Math.floor(
                                                                product.rating
                                                            )
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-600 ml-1">
                                                {product.rating} (
                                                {product.reviews})
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-gray-900">
                                                    {product.price}
                                                </span>
                                                <span className="text-sm text-gray-500 line-through">
                                                    {product.originalPrice}
                                                </span>
                                            </div>

                                            <button className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors">
                                                <ShoppingCart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                <CarouselPrevious className="hidden md:flex -left-12 bg-white border-2 border-gray-200 hover:bg-gray-50" />
                <CarouselNext className="hidden md:flex -right-12 bg-white border-2 border-gray-200 hover:bg-gray-50" />
            </Carousel>

            <div className="flex justify-center mt-6 md:hidden">
                <div className="flex gap-2">
                    {products.map((_, index) => (
                        <div
                            key={index}
                            className="w-2 h-2 rounded-full bg-gray-300"
                        />
                    ))}
                </div>
            </div> */}
        </div>
    )
}
