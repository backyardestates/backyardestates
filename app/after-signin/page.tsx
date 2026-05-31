import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Post-sign-in landing. Every role now lands on the unified, permission-driven
 * launchpad at /tools/dashboard — it surfaces the right tools per role, so we no
 * longer fan out to per-role homes.
 *
 * Configure Clerk's "after sign-in URL" (or NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL)
 * to /after-signin so users land here on every authentication.
 *
 * If you came here with ?returnTo=… (e.g. via a guard redirect), we honor that
 * destination instead — useful for "you tried to open X but had to sign in
 * first" flows.
 */
export default async function AfterSigninPage({
    searchParams,
}: {
    searchParams: Promise<{ returnTo?: string; redirect_url?: string }>;
}) {
    const { returnTo, redirect_url } = await searchParams;

    try {
        await getDbUser();
    } catch {
        // Not signed in — kick back to sign-in. Middleware should have caught
        // this already, but be defensive.
        redirect("/sign-in");
    }

    // Honor explicit return-to first. Only accept same-origin paths (prevent
    // open-redirect via a crafted query param).
    const returnPath = returnTo ?? redirect_url;
    if (returnPath && returnPath.startsWith("/") && !returnPath.startsWith("//")) {
        redirect(returnPath);
    }

    redirect("/tools/dashboard");
}
