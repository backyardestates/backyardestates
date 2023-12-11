import Image from 'next/image'
import SectionTitle from '@/components/SectionTitle'
import StandaloneLink from '@/components/StandaloneLink'
import Divider from '@/components/Divider'

import style from './Floorplans.module.css'
import Button from '../Button'

export default function Floorplans({ showNav = false }) {
    const estates = [
        { title: 'Estate 350', number: '350' },
        { title: 'Estate 450', number: '450' },
        { title: 'Estate 500', number: '500' },
        { title: 'Estate 750', number: '750' },
        { title: 'Estate 750+', number: '750plus' },
        { title: 'Estate 800', number: '800' },
        { title: 'Estate 950', number: '950' },
        { title: 'Estate 1200', number: '1200' },
    ]

    const bed = 'Studio'
    const bath = 1
    const sqft = 350
    const price = 175
    return (
        <div className={style.base}>
            <SectionTitle
                title="Explore our floor plans"
                explanation="Any floor plan can be customized to meet your adu needs"
            />
            <div className={style.content}>
                {showNav && (
                    <ul className={style.tags}>
                        {estates.map((estate, index) => (
                            <li key={index}>
                                <button className={style.tag}>
                                    {estate.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className={style.comp}>
                    <div className={style.container}>
                        <div className={style.columnLeft}>
                            <h2>Estate 350</h2>
                            <ul className={style.information}>
                                <li>
                                    {bed === 'Studio' ? `${bed}` : `${bed} Bed`}
                                </li>
                                <li>
                                    <Divider />
                                </li>
                                <li>{`${bath} Bath`}</li>
                                <li>
                                    <Divider />
                                </li>
                                <li>{`${sqft} sq. ft.`}</li>
                                <li>
                                    <Divider />
                                </li>
                                <li>
                                    Starting at{' '}
                                    <strong>{`$${price},000`}</strong>
                                </li>
                            </ul>
                            <p>
                                Interdum velit euismod in pellentesque massa
                                placerat duis ultricies lacus sed turpis
                                tincidunt id aliquet risus feugiat in ante metus
                                dictum at tempor commodo ullamcorper a lacus
                                vestibulum sed arcu
                            </p>
                            <StandaloneLink theme="beige" href="#">
                                Download floor plan
                            </StandaloneLink>
                        </div>
                        <div className={style.columnRight}>
                            <Image
                                src="/images/fpo-video.png"
                                alt="Placeholder"
                                width={640}
                                height={360}
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    aspectRatio: '16 / 9',
                                }}
                                className={style.img}
                            />
                        </div>
                    </div>
                    <div className={style.buttonGroup}>
                        <div className={style.buttonGroupButtonLeft}>
                            Walkthrough
                        </div>
                        <div className={style.buttonGroupButtonRight}>
                            Floor plan
                        </div>
                    </div>
                </div>
            </div>
            <Button theme="beige">Talk to an ADU specialist</Button>
        </div>
    )
}
