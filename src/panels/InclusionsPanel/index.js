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
                                Wood construction cabinets with soft-close
                                shaker style wooden doors and face frames
                            </p>
                        </AccordionPanel>
                        <AccordionPanel label="Counter tops">
                            <p>
                                Quartz with 4&Prime; backsplash and beveled edge
                            </p>
                        </AccordionPanel>
                        <AccordionPanel label="Appliances">
                            <p>
                                Stainless steel 36&Prime; fridge, 30&Prime;
                                range, 24&Prime; dishwasher, and over-the-range
                                microwave
                            </p>
                        </AccordionPanel>
                        <AccordionPanel label="Sink">
                            <p>
                                33&Prime; stainless steel single cell undermount
                                sink with garbage disposal
                            </p>
                        </AccordionPanel>
                        <AccordionPanel label="Faucet">
                            <p>Single-handle faucet with pulldown sprayer</p>
                        </AccordionPanel>
                        <AccordionPanel label="Lightning">
                            <p>4&Prime; LED recessed lights (2-4 per plan)</p>
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
