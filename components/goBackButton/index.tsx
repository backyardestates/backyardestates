'use client'
import { useRouter } from "next/navigation"
import Logo from "../Logo"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/pro-solid-svg-icons"
import styles from "./TopBar.module.css"

export function TopBar() {
    const router = useRouter()

    function goBack() {
        if (document.referrer && window.history.length > 1) {
            router.back()
        } else {
            router.push('/')
        }
    }

    return (
        <div className={styles.topBar}>
            <Logo />
            <FontAwesomeIcon
                icon={faXmark}
                size="xl"
                className={styles.icon}
                onClick={goBack}
            />
        </div>
    )
}
