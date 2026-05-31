"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import type { Role } from "@prisma/client";
import { DASHBOARD_SECTIONS, hasAnyPermission } from "@/lib/dashboard/registry";
import { NotificationBell } from "./NotificationBell";
import s from "./ToolsNav.module.css";

interface Props {
    signedIn: boolean;
    role: Role | null;
    email: string | null;
    permissions: string[];
}

/** Routes where the nav should hide itself entirely (e.g. print-style pages
 *  whose output would otherwise carry the nav into a generated PDF). */
const HIDE_ON_ROUTES = ["/tools/admin/master/agreement"];

/** Hrefs that should only be "active" on an exact match (landing pages that are
 *  prefixes of many child routes). */
const EXACT_MATCH = new Set(["/tools/dashboard"]);

export function ToolsNav({ signedIn, role, email, permissions }: Props) {
    const pathname = usePathname() ?? "";

    if (HIDE_ON_ROUTES.some((p) => pathname.startsWith(p))) {
        return null;
    }

    const perms = new Set(permissions);

    function isActive(href: string): boolean {
        if (EXACT_MATCH.has(href)) return pathname === href;
        return pathname === href || pathname.startsWith(href + "/");
    }

    // Single source of truth: the dashboard registry drives both these links and
    // the launchpad tiles, so the two never drift apart.
    const navSections = DASHBOARD_SECTIONS.filter(
        (sec) => sec.showInNav && hasAnyPermission(perms, sec.requiredPermissions),
    );

    return (
        <nav className={s.nav} aria-label="Tools navigation">
            <div className={s.brandWrap}>
                <Link href="/" className={s.brand}>Backyard Estates</Link>
                <span className={s.brandSub}>Tools</span>
            </div>

            <div className={s.links}>
                {signedIn && (
                    <NavLink href="/tools/dashboard" active={isActive("/tools/dashboard")}>
                        Dashboard
                    </NavLink>
                )}
                {navSections.map((sec) => (
                    <NavLink key={sec.key} href={sec.href} active={isActive(sec.href)}>
                        {sec.navLabel}
                    </NavLink>
                ))}
            </div>

            <div className={s.right}>
                {signedIn ? (
                    <>
                        <NotificationBell />
                        <div className={s.userChip}>
                            {email && <span className={s.userEmail}>{email}</span>}
                            {role && <span className={`${s.rolePill} ${s[`role_${role}`] ?? ""}`}>{role}</span>}
                        </div>
                        <SignOutButton>
                            <button type="button" className={s.btnSecondary}>Sign out</button>
                        </SignOutButton>
                    </>
                ) : (
                    <SignInButton mode="modal">
                        <button type="button" className={s.btnPrimary}>Sign in</button>
                    </SignInButton>
                )}
            </div>
        </nav>
    );
}

function NavLink({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={`${s.link} ${active ? s.linkActive : ""}`}
            aria-current={active ? "page" : undefined}
        >
            {children}
        </Link>
    );
}
