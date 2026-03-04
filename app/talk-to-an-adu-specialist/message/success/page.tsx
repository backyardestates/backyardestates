import Link from "next/link"
import { TopBar } from "@/components/goBackButton"
import Footer from "@/components/Footer"

export default function MessageSuccess() {
    return (
        <main style={{ minHeight: "100vh" }}>
            <TopBar />
            <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
                <h1>Message received</h1>
                <p style={{ color: "#5e5e5e", lineHeight: 1.6, maxWidth: 720, margin: "10px auto 18px" }}>
                    Thanks — a Backyard Estates specialist will get back to you within one business day.
                </p>
                <Link href="/talk-to-an-adu-specialist" style={{ fontWeight: 700, color: "#36484b" }}>
                    Back to contact options →
                </Link>
            </div>
            <Footer />
        </main>
    )
}
