import styles from "./page.module.css";
import { client } from "@/sanity/client";
import { SELECTIONS_QUERY } from "@/sanity/queries";
import { groupSelections } from "@/lib/groupSelections";
import SelectionsGallery from "@/components/SelectionsGallery";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default async function SelectionsPage() {
    const selections = await client.fetch(SELECTIONS_QUERY);
    const groupedSelections = groupSelections(selections);
    console.log(selections);

    return (
        <>
            <Nav />
            <section className={styles.experienceContainer}>
                {/* HERO */}
                <header className={styles.blueprintHero}>
                    <h1 className={styles.heroTitle}>Design Selections</h1>
                    <p className={styles.heroText}>
                        Explore the finishes, fixtures, and materials included in our ADUs —
                        with clear standard options and available upgrades.
                    </p>
                </header>

                <SelectionsGallery data={groupedSelections} />
            </section>
            <Footer />
        </>

    );
}
