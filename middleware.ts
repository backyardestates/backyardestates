import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { normalizeRole } from "./types/roles";

const isCustomerRoute = createRouteMatcher(["/tools/feasibility(.*)"]);
const isArchitectRoute = createRouteMatcher(["/tools/fpa(.*)", "/api/architect(.*)"]);
const isAdminRoute = createRouteMatcher(["/tools/admin(.*)", "/api/admin(.*)"]);

// helper: safely read role from possible claim locations
function getRoleFromClaims(sessionClaims: any) {
    // common locations across Clerk versions / templates
    const role = sessionClaims.role
    return normalizeRole(role);
}

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // Require sign-in for protected routes
    if ((isAdminRoute(req) || isArchitectRoute(req) || isCustomerRoute(req)) && !userId) {
        return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If not logged in and not protected, do nothing
    if (!userId) return;

    // IMPORTANT: sessionClaims may not include metadata unless token template includes it
    const role = getRoleFromClaims(sessionClaims);

    // Admin-only
    if (isAdminRoute(req) && role !== "ADMIN") {
        return new Response("Forbidden", { status: 403 });
    }

    // Architect or Admin
    if (isArchitectRoute(req) && role !== "ARCHITECT" && role !== "ADMIN") {
        return new Response("Forbidden", { status: 403 });
    }

    // Customer route: any signed-in role is fine
});


export const config = {
    matcher: [
        "/((?!.*\\..*|_next|api/webhooks).*)",
        "/",
        "/(api|trpc)(.*)",
    ],
};