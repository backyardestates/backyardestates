import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer"
import LegalPrint from "@/components/LegalPrint"
import { ContactLeadForm } from "@/components/Contact/Forms/ContactLeadForm"
import { Metadata } from "next"
export const metadata: Metadata = {
    title: "Schedule a Free ADU Phone Consultation | Backyard Estates",
    description:
        "Book a free 15-minute phone consultation with a Backyard Estates ADU specialist. Learn what can work on your property and get clear next steps.",
    keywords: [
        "schedule ADU consultation",
        "ADU phone consultation",
        "free ADU call",
        "ADU builder phone call",
        "ADU planning consultation",
    ],
    alternates: {
        canonical:
            "https://www.backyardestates.com/talk-to-an-adu-specialist/schedule-call",
    },
    openGraph: {
        title: "Schedule a Free ADU Phone Consultation",
        description:
            "Book a free 15-minute call with an ADU specialist to review your property.",
        url:
            "https://www.backyardestates.com/talk-to-an-adu-specialist/schedule-call",
        type: "website",
    },
};


export default function ScheduleCallPage() {
    return (
        <main className={styles.main}>
            <TopBar />
            <div className={styles.container}>
                <div className={styles.maxWidth}>
                    <ContactLeadForm
                        intent="INTRO_CALL"
                        submitLabel="Continue"
                        successRedirectBase="/talk-to-an-adu-specialist/schedule-call/calendly"
                    />
                    <LegalPrint />
                </div>
            </div>
            <Footer />
        </main>
    )
}
