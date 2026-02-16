import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer"
import LegalPrint from "@/components/LegalPrint"
import { ContactLeadForm } from "@/components/Contact/Forms/ContactLeadForm"
import { Metadata } from "next"
export const metadata: Metadata = {
    title: "Free ADU Office Consultation | Property Feasibility Review",
    description:
        "Visit Backyard Estates for a free in-office ADU consultation. We review your lot, setbacks, utilities, and layout options to determine what’s possible before you design.",
    keywords: [
        "ADU office consultation",
        "ADU feasibility review",
        "ADU property analysis",
        "ADU site review",
        "ADU planning meeting",
    ],
    alternates: {
        canonical:
            "https://www.backyardestates.com/talk-to-an-adu-specialist/office-consultation",
    },
    openGraph: {
        title: "Free ADU Office Consultation",
        description:
            "Review your property on the big screen with our ADU specialists and get clear next steps.",
        url:
            "https://www.backyardestates.com/talk-to-an-adu-specialist/office-consultation",
        type: "website",
    },
};


export default function OfficeConsultationPage() {
    return (
        <main className={styles.main}>
            <TopBar />
            <div className={styles.container}>
                <div className={styles.maxWidth}>
                    <ContactLeadForm
                        intent="OFFICE_CONSULT"
                        submitLabel="Continue"
                        successRedirectBase="/talk-to-an-adu-specialist/office-consultation/calendly"
                    />
                    <LegalPrint />
                </div>
            </div>
            <Footer />
        </main>
    )
}
