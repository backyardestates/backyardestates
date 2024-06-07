import TabBar from '@/components/TabBar'
import Image from 'next/image'
import style from './InclusionsPanel.module.css'
import ImageBar from '@/components/ImageBar'
import Accordion from '@/components/Accordion'
import AccordionHeader from '@/components/AccordionHeader'
import AccordionPanel from '@/components/AccordionPanel'

export default function InclusionsPanel() {
    return (
        <div className={style.base}>
            <div className={style.interface}>
                <div className={style.header}>
                    <p className={style.subhead}>
                        Choose your preferred package
                    </p>
                    <TabBar />
                </div>
                <div className={style.rooms}>
                    <ImageBar />
                </div>
                <div className={style.preview}>
                    <Image
                        src="/images/preview/preview-FPO.png"
                        width={790}
                        height={790}
                        alt="Picture of the author"
                        className={style.previewImage}
                    />
                </div>
                <div className={style.sidebar}>
                    <Accordion>
                        <AccordionPanel label="Cabinets" isOpen>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua.
                            </p>
                        </AccordionPanel>
                        <AccordionPanel label="Counter tops">
                            <p>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua.
                            </p>
                        </AccordionPanel>
                        <AccordionPanel label="Appliances">
                            <p>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua.
                            </p>
                        </AccordionPanel>
                    </Accordion>
                </div>
                <div className={style.description}>
                    This contemporary look combines muted grays with white
                    accents, enhanced by a light off-white interior paint. The
                    result is a bold yet understated style.
                </div>
            </div>
        </div>
    )
}
