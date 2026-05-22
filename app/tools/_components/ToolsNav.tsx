"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import type { Role } from "@prisma/client";
import s from "./ToolsNav.module.css";

interface Props {
    signedIn: boolean;
    role: Role | null;
    email: string | null;
}

/** Routes where the nav should hide itself entirely (e.g. print-style pages
 *  whose output would otherwise carry the nav into a generated PDF). */
const HIDE_ON_ROUTES = [
    "/tools/admin/master/agreement",
];

export function ToolsNav({ signedIn, role, email }: Props) {
    const pathname = usePathname() ?? "";

    if (HIDE_ON_ROUTES.some((p) => pathname.startsWith(p))) {
        return null;
    }

    const isAdmin = role === "ADMIN";
    const isArchitect = role === "ARCHITECT";
    const canBuild = isAdmin || isArchitect;

    // Mark the current section so the user always knows where they are.
    function isActive(href: string): boolean {
        if (href === "/tools/dashboard") return pathname === href;
        return pathname === href || pathname.startsWith(href + "/");
    }

    return (
        <nav className={s.nav} aria-label="Tools navigation">
            <div className={s.brandWrap}>
                <Link href="/" className={s.brand}>Backyard Estates</Link>
                <span className={s.brandSub}>Tools</span>
            </div>

            <div className={s.links}>
                {signedIn && (
                    <NavLink href="/tools/dashboard" active={isActive("/tools/dashboard")}>
                        My Proposals
                    </NavLink>
                )}
                {isAdmin && (
                    <NavLink href="/tools/admin/dashboard" active={isActive("/tools/admin/dashboard")}>
                        Admin Dashboard
                    </NavLink>
                )}
                {canBuild && (
                    <NavLink href="/tools/admin/master" active={isActive("/tools/admin/master")}>
                        New / Edit Proposal
                    </NavLink>
                )}
                {signedIn && (
                    <NavLink href="/tools/feasibility" active={isActive("/tools/feasibility")}>
                        Feasibility
                    </NavLink>
                )}
            </div>

            <div className={s.right}>
                {signedIn ? (
                    <>
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
