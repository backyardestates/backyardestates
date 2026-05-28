import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { normalizeRole } from "./types/roles";

const isPublicRoute = createRouteMatcher([
    "/present",
    "/present/(.*)",
    "/access-denied",
    // Signed magic-link endpoint used by the new-signup notification email
    // to let edgar@ click a button and assign a role from his inbox. Auth
    // is via HMAC inside the route handler, not Clerk session.
    "/api/admin/users/role-link",
]);

// Any-signed-in routes: feasibility flow + personal user dashboard +
// the smart post-sign-in landing.
const isAnySignedInRoute = createRouteMatcher([
    "/tools/feasibility(.*)",
    "/tools/dashboard(.*)",
    "/after-signin",
]);

// Architect carve-out — checked BEFORE the admin catch-all so /tools/admin/master
// and /api/admin/proposals stay available to ARCHITECTs even though they live
// under the /tools/admin/* and /api/admin/* trees.
const isArchitectRoute = createRouteMatcher([
    "/tools/fpa(.*)",
    "/api/architect(.*)",
    "/tools/admin/master(.*)",
    "/api/admin/proposals(.*)",
    // Engagement pipeline — reps (ADMIN) and architects both work here; the
    // API enforces per-user visibility (own engagements / assigned analyses).
    "/tools/engagements(.*)",
    "/api/engagements(.*)",
    "/api/consultations(.*)",
]);

// Admin catch-all — everything under /tools/admin/* and /api/admin/* that the
// architect carve-out didn't claim (dashboard, settings, users, dev tools).
const isAdminRoute = createRouteMatcher(["/tools/admin(.*)", "/api/admin(.*)"]);

function getRoleFromClaims(sessionClaims: any) {
    const role = sessionClaims?.role;
    return normalizeRole(role);
}

/** Build the friendly /access-denied URL for a middleware-level role miss.
 *  API routes get a JSON 403 instead — redirecting an API response is
 *  hostile to fetch callers. */
function denyForUser(req: Request, neededRoles: string[]) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
        return new Response(
            JSON.stringify({ error: "Forbidden", need: neededRoles }),
            { status: 403, headers: { "Content-Type": "application/json" } },
        );
    }
    url.searchParams.set("need", neededRoles.join(","));
    url.searchParams.set("from", url.pathname);
    url.pathname = "/access-denied";
    return NextResponse.redirect(url);
}

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // Public routes — never require auth
    if (isPublicRoute(req)) return;

    // Require sign-in for any of our gated trees
    if (
        (isAdminRoute(req) || isArchitectRoute(req) || isAnySignedInRoute(req)) &&
        !userId
    ) {
        return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If not logged in and not protected, do nothing
    if (!userId) return;

    const role = getRoleFromClaims(sessionClaims);

    // Architect carve-out wins over the admin catch-all — check first.
    if (isArchitectRoute(req)) {
        if (role !== "ARCHITECT" && role !== "ADMIN") {
            return denyForUser(req, ["ARCHITECT", "ADMIN"]);
        }
        return;
    }

    // Admin-only (everything else under /tools/admin and /api/admin)
    if (isAdminRoute(req) && role !== "ADMIN") {
        return denyForUser(req, ["ADMIN"]);
    }

    // /tools/dashboard and /tools/feasibility need only sign-in (handled above).
});


export const config = {
    matcher: [
        "/((?!.*\\..*|_next|api/webhooks).*)",
        "/",
        "/(api|trpc)(.*)",
    ],
};
