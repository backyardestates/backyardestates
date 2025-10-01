import styles from "./Banner.module.css";

type BannerProps = {
    text: string;
    buttonText: string;
    buttonLink: string;
    backgroundColor?: string;
    buttonBackgroundColor?: string;
};

export default function Banner({
    text,
    buttonText,
    buttonLink,
    backgroundColor,
    buttonBackgroundColor,
}: BannerProps) {
    return (
        <div
            className={styles.banner}
            style={{ backgroundColor: backgroundColor || "#b99764" }}
        >
            <div className={styles.content}>
                <p className={styles.text}>{text}</p>
                <a
                    className={styles.button}
                    href={buttonLink}
                >
                    {buttonText}
                </a>
            </div>

        </div>
    );
}
