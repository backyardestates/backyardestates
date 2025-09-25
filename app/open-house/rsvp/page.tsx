import { RSVPForm } from "@/components/RsvpForm"
import styles from "./page.module.css"
import { TopBar } from "@/components/goBackButton"
import EventDetails from "@/components/EventDetails"
import { sanityFetch } from "@/sanity/live";
import { OPEN_HOUSES_QUERY } from "@/sanity/queries";

export default async function Home() {
    const openHouse = await sanityFetch({
        query: OPEN_HOUSES_QUERY,
        params: { slug: "phillips" },
    });


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
        </main >

    )
}
