import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer"
import LegalPrint from "@/components/LegalPrint"
import { ContactLeadForm } from "@/components/Contact/Forms/ContactLeadForm"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
    title: "Send Us a Message",
    description:
        "Send a message to the Backyard Estates team and an ADU specialist will get back to you within one business day.",
    path: "/talk-to-an-adu-specialist/message",
    noindex: true,
})

export default function MessagePage() {
    return (
        <main className={styles.main}>
            <TopBar />
            <div className={styles.container}>
                <div className={styles.maxWidth}>
                    <ContactLeadForm
                        intent="MESSAGE"
                        submitLabel="Send message"
                        successRedirectBase="/talk-to-an-adu-specialist/message/success"
                    />
                    <LegalPrint />
                </div>
            </div>
            <Footer />
        </main>
    )
}
