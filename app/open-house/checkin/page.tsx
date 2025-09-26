import { decodeRsvpToken } from "@/utils/generateRSVPToken";
import ClientCheckIn from "@/components/ClientCheckIn";
import { markDealAttended } from "@/utils/pipedrive";
import { TopBar } from "@/components/goBackButton";
import style from "./page.module.css";

// Use default export async function
export default async function CheckInPage({ searchParams }: any) {
    const token = searchParams?.token;

    if (!token) {
        return <div className={style.error}>❌ No token provided</div>;
    }

    const decoded = decodeRsvpToken(token);
    if (!decoded) {
        return <div className={style.error}>❌ Invalid or expired token</div>;
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
