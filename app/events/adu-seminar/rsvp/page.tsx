import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer";
import LegalPrint from "@/components/LegalPrint";
import { ADUSeminarRSVPForm } from "@/components/ADUSeminarRSVPForm";
import formatDate from "@/utils/dates";

export default async function Home({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const slug = await params;
    async function getStageIds(pipeline_id) {

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/stages?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}&pipeline_id=${pipeline_id}`, {
            method: 'GET',
        }
        )
        const data = await res.json()

    }

    const stages = await getStageIds(8)

    async function getDealFields(pipeline_id) {

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/dealFields?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}`, {
            method: 'GET',
        }
        )
        const data = await res.json()

    }

    const fields = await getDealFields(7)

    const dates = ["2025-10-08"]
    const time = ["6:00 PM"]

    return (
        <main className={styles.main}>
            <TopBar></TopBar>
            <div className={styles.container}>
                <div className={styles.maxWidth2xl}>
                    <div className={styles.textCenter + " " + styles.mb8}>
                        <h1 className={styles.header}>
                            ADU Seminar
                        </h1>
                        <p className={styles.description}>{formatDate(dates[0])} - {time}</p>
                    </div>

                    <ADUSeminarRSVPForm dates={dates} params={slug} />
                    <LegalPrint />
                </div>
            </div>
            <Footer />
        </main >

    )
}
