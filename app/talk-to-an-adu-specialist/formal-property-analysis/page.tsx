import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer"
import LegalPrint from "@/components/LegalPrint"
import { ContactLeadForm } from "@/components/Contact/Forms/ContactLeadForm"
import { Metadata } from "next"
export const metadata: Metadata = {
    title: "Schedule a Formal Property Analysis | Onsite ADU Feasibility | Backyard Estates",
    description:
        "Schedule your Formal Property Analysis with Backyard Estates. Our architect and engineering team visit your property and verify 250+ items — utilities, site conditions, and city rules — so your proposal is built on facts, not assumptions. $500, fully credited toward your build.",
    keywords: [
        "Formal Property Analysis",
        "ADU property analysis",
        "onsite ADU feasibility",
        "ADU site assessment",
        "ADU feasibility study",
        "ADU property inspection",
    ],
    alternates: {
        canonical:
            "https://www.backyardestates.com/talk-to-an-adu-specialist/formal-property-analysis",
    },
    openGraph: {
        title: "Schedule a Formal Property Analysis",
        description:
            "Our architect and engineering team verify 250+ items on your property — $500, fully credited toward your build.",
        url:
            "https://www.backyardestates.com/talk-to-an-adu-specialist/formal-property-analysis",
        type: "website",
    },
};


export default function FormalPropertyAnalysisPage() {
    return (
        <main className={styles.main}>
            <TopBar />
            <div className={styles.container}>
                <div className={styles.maxWidth}>
                    <ContactLeadForm
                        intent="FPA"
                        submitLabel="Continue"
                        successRedirectBase="/talk-to-an-adu-specialist/formal-property-analysis/calendly"
                    />
                    <LegalPrint />
                </div>
            </div>
            <Footer />
        </main>
    )
}
