import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer"
import LegalPrint from "@/components/LegalPrint"
import { ContactLeadForm } from "@/components/Contact/Forms/ContactLeadForm"

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
