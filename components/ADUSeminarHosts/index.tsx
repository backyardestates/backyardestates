import styles from "./ADUSeminarHosts.module.css";
import Image from "next/image";

const seminarHosts = [

    {
        id: 1,
        name: "Tom Gibson",
        role: "Director of Construction",
        photo: "/portraits/tom-gibson.png",
        description:
            "Tom Gibson has 50+ years of hands-on experience in construction, from electrical work to leading multi-family and senior housing projects. Founder of Tom W. Gibson, Inc., Tom brings unmatched expertise to Backyard Estates, overseeing projects with precision and ensuring the highest quality builds.",
    },
    {
        id: 2,
        name: "Adam Stewart",
        role: "President & Founder",
        photo: "/portraits/adam-stewart.png",
        description:
            "With a BS in Finance and a Master’s in Business Entrepreneurship, Adam combines business insight with hands-on project-management expertise. As President of Backyard Estates, he ensures every project runs smoothly, on time, and on budget, combining a passion for design with practical expertise.",
    },
];

export default function ADUSeminarHosts() {
    return (
        <div>
            <div className={styles.headerSection}>
                <h2 className={styles.sectionTitle}>Meet Your ADU Experts</h2>
                <p className={styles.sectionSubtitle}>
                    Learn from the team that builds and designs ADUs in Los Angeles County.
                </p>
            </div>

            {seminarHosts.map((host, index) => {
                const isOdd = index % 2 !== 0;
                return (
                    <div className={styles.timelineContainer} key={host.id}>
                        <div className={`${styles.weekRow} ${isOdd ? styles.left : styles.right}`}>
                            <div className={`${styles.stageRow} ${isOdd ? "odd" : styles.even}`}>
                                <div className={styles.card}>
                                    <div className={styles.cardContent}>
                                        <Image
                                            src={host.photo}
                                            alt={host.name}
                                            width={400}
                                            height={400}
                                            className={styles.cardImage}
                                        />
                                    </div>
                                </div>

                                <div className={styles.textContent}>
                                    <h3 className={styles.weekTitle}>{host.name}</h3>
                                    <h4 className={styles.weekSubtitle}>{host.role}</h4>
                                    <p className={styles.weekDescription}>{host.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
