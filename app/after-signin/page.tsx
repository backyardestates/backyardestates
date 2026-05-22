import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Post-sign-in landing. Reads the user's effective role and bounces them to
 * the right place:
 *
 *   ADMIN     → /tools/admin/dashboard
 *   ARCHITECT → /tools/dashboard
 *   CUSTOMER  → /tools/dashboard
 *
 * Configure Clerk's "after sign-in URL" (or NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL)
 * to /after-signin so users land here on every authentication.
 *
 * If you came here with ?returnTo=… (e.g. via a guard redirect), we honor
 * that destination instead — useful for "you tried to open X but had to sign
 * in first" flows.
 */
export default async function AfterSigninPage({
    searchParams,
}: {
    searchParams: Promise<{ returnTo?: string; redirect_url?: string }>;
}) {
    const { returnTo, redirect_url } = await searchParams;

    let user;
    try {
        user = await getDbUser();
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

    switch (user.role) {
        case Role.ADMIN:
            redirect("/tools/admin/dashboard");
        case Role.ARCHITECT:
            redirect("/tools/dashboard");
        case Role.CUSTOMER:
        default:
            redirect("/tools/dashboard");
    }
}
