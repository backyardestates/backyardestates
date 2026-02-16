import Link from "next/link"
import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer"
import LegalPrint from "@/components/LegalPrint"
import { ContactOptionCard } from "@/components/Contact/Card/ContactOptionCard"
import { Phone, HouseIcon, User2, MessageCircle } from "lucide-react"

const PHONE_DISPLAY = "(909) 500-0917"
const PHONE_TEL = "tel:+19095000917"
const HOURS = "Monday through Friday from 8AM to 5PM"

export default function TalkToSpecialistHub() {
    return (
        <main className={styles.main}>
            <TopBar />
            <div className={styles.container}>
                <div className={styles.maxWidth}>
                    <header className={styles.header}>
                        <h1 className={styles.h1}>We’re here to help.</h1>
                        <p className={styles.p}>
                            Get in touch with our team of ADU specialists. Choose the option that fits you best.
                        </p>
                    </header>

                    <section className={styles.grid}>

                        <ContactOptionCard
                            Logo={Phone}
                            title="Schedule a phone call"
                            description="Book a 15-minute phone call to learn what can work on your property."
                            href="/talk-to-an-adu-specialist/schedule-call"
                            cta="Schedule →"
                        />

                        <ContactOptionCard
                            Logo={User2}
                            title="Schedule a free office consultation"
                            description="We’ll review your property on the big screen with our advanced software and give you clear next steps."
                            href="/talk-to-an-adu-specialist/office-consultation"
                            cta="Reserve a time →"
                        />

                        <ContactOptionCard
                            Logo={MessageCircle}
                            title="Send us a message"
                            description="Prefer email? A specialist will get back to you within one business day."
                            href="/talk-to-an-adu-specialist/message"
                            cta="Send message →"
                        />

                        <ContactOptionCard
                            Logo={HouseIcon}
                            title="Visit an open house"
                            description="Tour a Backyard Estates ADU, explore layout options, and get guidance from our team."
                            href="/events"
                            cta="View events →"
                        />


                        <ContactOptionCard Logo={Phone} href={PHONE_TEL} title="Give us a call" description={`Call us at ${PHONE_DISPLAY}. Available ${HOURS}.`} cta="Call now →" />
                    </section>

                    <div className={styles.faq}>
                        <div className={styles.faqTop}>Read the answers to common questions</div>
                        <Link className={styles.faqLink} href="/frequently-asked-questions">
                            Frequently Asked Questions →
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    )
}
