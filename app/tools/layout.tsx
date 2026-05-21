import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { ToolsNav } from "./_components/ToolsNav";
import "./_components/tools-theme.css";

/**
 * Top-level layout for every `/tools/*` route. Fetches the current Clerk
 * session + DB role on the server, then renders a role-aware nav bar above
 * each child page. Unauthenticated visitors get a Sign-in button (the
 * Clerk middleware also redirects them, but the nav handles edge cases like
 * a public sub-route being added later).
 *
 * The nav hides itself on the print-style agreement route (`/tools/admin/
 * master/agreement`) and via `@media print` so generated PDFs stay clean.
 */
export default async function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    let role: Role | null = null;
    let email: string | null = null;

    if (userId) {
        // findUnique avoids the upsert side-effect of getDbUser() since we
        // don't need to mutate the row just to render a nav. .catch() keeps
        // the layout rendering even if the DB is unreachable.
        const dbUser = await prisma.user
            .findUnique({
                where: { id: userId },
                select: { role: true, email: true },
            })
            .catch(() => null);
        if (dbUser) {
            role = dbUser.role;
            email = dbUser.email ?? null;
        }
    }

    return (
        <>
            <ToolsNav signedIn={!!userId} role={role} email={email} />
            {children}
        </>
    );
}
