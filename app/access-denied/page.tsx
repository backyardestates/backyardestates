import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "../../types/roles";
import { RequestAccessButton } from "./RequestAccessButton";
import s from "./access-denied.module.css";

export const dynamic = "force-dynamic";

function dashboardForRole(role: Role | null): { href: string; label: string } {
    if (role === Role.ADMIN) return { href: "/tools/admin/dashboard", label: "Admin dashboard" };
    if (role === Role.ARCHITECT) return { href: "/tools/dashboard", label: "Your proposals" };
    return { href: "/tools/dashboard", label: "Your dashboard" };
}

function parseNeeded(raw: string | undefined): Role[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s): s is Role => s === "ADMIN" || s === "ARCHITECT" || s === "CUSTOMER");
}

export default async function AccessDeniedPage({
    searchParams,
}: {
    searchParams: Promise<{ need?: string; from?: string }>;
}) {
    const { need: rawNeed, from } = await searchParams;
    const needed = parseNeeded(rawNeed);

    const { userId } = await auth();
    let role: Role | null = null;
    let signedInIdentity: string | null = null;

    if (userId) {
        // Read role from DB if we have a row; otherwise fall back to Clerk
        // publicMetadata so we still personalize the message.
        const [dbUser, clerkUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } }),
            currentUser(),
        ]);
        role = dbUser?.role ?? (normalizeRole(clerkUser?.publicMetadata?.role) as Role);
        signedInIdentity = dbUser?.email
            ?? clerkUser?.emailAddresses[0]?.emailAddress
            ?? userId;
    }

    const home = dashboardForRole(role);
    // Build a comma-joined string of the roles the gate required. This is
    // ONLY used server-side as context in the request-access email — never
    // displayed to the user, who shouldn't need to know which specific role
    // gates a page.
    const neededRoles = needed.join(",");

    return (
        <div className={s.shell}>
            <div className={s.card}>
                <div className={s.icon} aria-hidden>🔒</div>
                <h1 className={s.title}>Access required</h1>

                {!userId ? (
                    <p className={s.body}>
                        You need to be signed in to view this page.
                    </p>
                ) : (
                    <>
                        <p className={s.body}>
                            You&apos;re signed in as <strong>{signedInIdentity}</strong>.
                        </p>
                        <p className={s.body}>
                            You don&apos;t have access to this page yet.
                        </p>
                    </>
                )}

                <div className={s.actions}>
                    {!userId ? (
                        <Link
                            href={`/sign-in${from ? `?redirect_url=${encodeURIComponent(from)}` : ""}`}
                            className={s.primaryAction}
                        >
                            Sign in
                        </Link>
                    ) : (
                        <RequestAccessButton from={from ?? null} need={neededRoles || null} />
                    )}
                    {userId && (
                        <Link href={home.href} className={s.secondaryAction}>
                            Go to {home.label}
                        </Link>
                    )}
                    <Link href="/" className={s.secondaryAction}>
                        Home
                    </Link>
                </div>

                <p className={s.help}>
                    Questions? Contact{" "}
                    <a href="mailto:edgar@backyardestates.com" className={s.helpLink}>
                        edgar@backyardestates.com
                    </a>.
                </p>
            </div>
        </div>
    );
}
