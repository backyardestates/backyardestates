import { decodeRsvpToken } from "@/utils/generateRSVPToken";
import ClientCheckIn from "@/components/ClientCheckIn";
import { markDealAttended } from "@/utils/pipedrive";
import { TopBar } from "@/components/goBackButton";
import style from "./page.module.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Use default export async function
export default async function CheckInPage({
    params
}: {
    params: Promise<{ slug: string, token: string }>
}) {
    const token = (await params).token;
    const slug = (await params).slug

    if (!token) {
        return (
            <>
                <Nav />
                <div className={style.error}>❌ No token provided</div>
                <Footer />
            </>

        );
    }

    const decoded = decodeRsvpToken(token);
    if (!decoded) {
        return (
            <>
                <Nav />
                <div className={style.error}>❌ Invalid or expired token</div>
                <Footer />
            </>
        )
    }

    const { personId } = decoded as { personId: string };

    let dealData: any = null;
    try {
        // This is async server logic
        dealData = await markDealAttended(personId);
    } catch (err) {
        console.error("Error marking deal as attended:", err);
    }


    return (
        <div>
            <TopBar />
            <ClientCheckIn dealData={dealData} />
        </div>
    );
}
