import Image from 'next/image'
import style from './CustomerStory.module.css'
import Divider from '@/components/Divider'
import StandaloneLink from '../StandaloneLink'
import Carousel from '../Carousel'

export default function CustomerStory() {
    const bed = 'Studio'
    const bath = 1
    const sqft = 350
    return (
        <div className={style.base}>
            <div className={style.columnLeft}>
                <div>
                    <div className={style.customer}>
                        <Image
                            src="/portrait-fpo.png"
                            alt="Hello"
                            width={120}
                            height={120}
                            className={style.portrait}
                        />
                        <div className={style.details}>
                            <p className={style.name}>Kyle and Joy</p>

                            <div className={style.detailsRow}>
                                <p className={style.location}>
                                    <strong className={style.estate}>
                                        Estate 450
                                    </strong>
                                    <br />
                                    Acadia, CA
                                </p>
                                <ul className={style.information}>
                                    <li>
                                        {bed === 'Studio'
                                            ? `${bed}`
                                            : `${bed} Bed`}
                                    </li>
                                    <li>
                                        <Divider />
                                    </li>
                                    <li>{`${bath} Bath`}</li>
                                    <li>
                                        <Divider />
                                    </li>
                                    <li>{`${sqft} sq. ft.`}</li>
                                </ul>
                            </div>
                            <StandaloneLink theme="beige" icon="download">
                                Download floor plan
                            </StandaloneLink>
                        </div>
                    </div>
                </div>

                <div>
                    <quote className={style.quote}>
                        &ldquo;We were looking for ways to invest our money. My
                        wife thought, why don&lsquo;t we build an ADU for rental
                        income?&rdquo;
                    </quote>
                    <p className={style.paragraph}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Quisque non tellus orci ac auctor.
                        Vestibulum morbi blandit cursus risus at ultrices mi
                        tempus imperdiet. Amet massa vitae tortor condimentum
                        lacinia.
                    </p>
                    <p className={style.paragraph}>
                        We highly recommend Backyard Estates.
                    </p>
                </div>
            </div>
            <div className={style.columnRight}>
                <Carousel />
            </div>
        </div>
    )
}
