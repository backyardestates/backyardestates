import { RSVPForm } from "@/components/RsvpForm"
import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import { sanityFetch } from "@/sanity/live";
import { OPEN_HOUSES_QUERY } from "@/sanity/queries";
import router from "next/navigation";
import Footer from "@/components/Footer";

export default async function Home() {
    const openHouse = await sanityFetch({
        query: OPEN_HOUSES_QUERY,
        params: { slug: "phillips" },
    });

    async function getStageIds(pipeline_id) {

        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN}.pipedrive.com/v1/stages?&api_token=${process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN}&pipeline_id=${pipeline_id}`, {
            method: 'GET',
        }
        )
        const data = await res.json()

        console.log('All stages ids:', data)
    }

    const stages = await getStageIds(7)

    return (
        <main className={styles.main}>
            <TopBar></TopBar>
            <div className={styles.container}>
                <div className={styles.maxWidth2xl}>
                    <div className={styles.textCenter + " " + styles.mb8}>
                        <h1 className={styles.header}>
                            ADU Open House Event
                        </h1>
                    </div>

                    <RSVPForm dates={openHouse.data.dates} />
                </div>
            </div>
            <Footer />
        </main >

    )
}
