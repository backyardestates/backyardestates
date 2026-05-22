import { Suspense } from "react";
import Link from "next/link";
import { Role } from "@prisma/client";
import { guardPageRole } from "@/lib/auth/guardPage";
import { getMergedUsers } from "@/lib/users/getMergedUsers";
import { ManageUserMenu } from "./ManageUserMenu";
import { Skeleton } from "../../../_components/Skeleton/Skeleton";
import s from "./users.module.css";

export const dynamic = "force-dynamic";

const ALL_ROLES = Object.values(Role);

function parseRoleParam(raw: string | undefined): Role | "ALL" {
    if (!raw || raw === "ALL") return "ALL";
    const upper = raw.toUpperCase();
    return (ALL_ROLES as string[]).includes(upper) ? (upper as Role) : "ALL";
}

function displayName(u: { firstName: string | null; lastName: string | null; email: string | null }): string {
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return name || u.email || "(no name)";
}

export default async function UsersListPage({
    searchParams,
}: {
    searchParams: Promise<{ role?: string }>;
}) {
    // Auth + searchParams: fast. The slow data (Clerk + DB merge) is fetched
    // inside the Suspense-wrapped UsersTable below so the page header renders
    // instantly while the table streams in.
    const caller = await guardPageRole([Role.ADMIN], "/tools/admin/dashboard/users");
    const callerId = caller.id;

    const { role: rawRole } = await searchParams;
    const filter = parseRoleParam(rawRole);

    return (
        <div className={s.shell}>
            <header className={s.header}>
                <div>
                    <Link href="/tools/admin/dashboard" className={s.backLink}>← Dashboard</Link>
                    <h1 className={s.title}>Users</h1>
                    <p className={s.subtitle}>
                        {filter !== "ALL" ? `Filtered by ${filter}` : "All users"}
                    </p>
                </div>
                <div className={s.headerNote}>
                    Identity comes from Clerk · Role changes write to both Clerk and the DB.
                </div>
            </header>

            <Suspense fallback={<UsersTableSkeleton />}>
                <UsersTable callerId={callerId} filter={filter} />
            </Suspense>
        </div>
    );
}

// ── Async server component: fetches merged users and renders the table ─────

async function UsersTable({ callerId, filter }: { callerId: string; filter: Role | "ALL" }) {
    const allUsers = await getMergedUsers();
    const filteredUsers = filter === "ALL" ? allUsers : allUsers.filter((u) => u.role === filter);

    const countBy: Record<string, number> = {};
    for (const u of allUsers) countBy[u.role] = (countBy[u.role] ?? 0) + 1;
    const total = allUsers.length;
    const inDbCount = allUsers.filter((u) => u.inDb).length;

    return (
        <>
            <p className={s.subtitle} style={{ margin: "-12px 0 16px" }}>
                {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}{filter !== "ALL" ? ` · ${filter}` : ""}
                {" · "}
                <span className={s.muted}>{inDbCount}/{total} have signed in</span>
            </p>

            <nav className={s.filterTabs}>
                <FilterTab label={`All (${total})`} value="ALL" active={filter === "ALL"} />
                {ALL_ROLES.map((r) => (
                    <FilterTab
                        key={r}
                        label={`${r} (${countBy[r] ?? 0})`}
                        value={r}
                        active={filter === r}
                    />
                ))}
            </nav>

            {filteredUsers.length === 0 ? (
                <div className={s.empty}>
                    No users match this filter.{" "}
                    {filter !== "ALL" && <Link href="/tools/admin/dashboard/users">Show all</Link>}
                </div>
            ) : (
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Role</th>
                                <th>Phone</th>
                                <th className={s.numCol}>Proposals</th>
                                <th className={s.numCol}>Assigned</th>
                                <th className={s.numCol}>Feasibility</th>
                                <th>Last sign-in</th>
                                <th>Joined</th>
                                <th className={s.actionsCol}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className={s.email}>
                                            {displayName(u)}
                                            {!u.inDb && (
                                                <span className={s.newBadge} title="Signed up in Clerk but has not yet hit a protected route">
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        {u.email && u.email !== displayName(u) && (
                                            <div className={s.muted}>{u.email}</div>
                                        )}
                                        <div className={s.userId} title={u.id}>{u.id.slice(0, 12)}…</div>
                                    </td>
                                    <td>
                                        <span className={`${s.rolePill} ${s[`role_${u.role}`] ?? ""}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className={s.muted}>{u.phone ?? "—"}</td>
                                    <td className={s.numCol}>{u.counts.proposalsCreated}</td>
                                    <td className={s.numCol}>{u.counts.proposalsAssigned}</td>
                                    <td className={s.numCol}>{u.counts.feasibilityReports}</td>
                                    <td className={s.muted}>
                                        {u.lastSignInAt ? u.lastSignInAt.toLocaleDateString() : <span className={s.never}>never</span>}
                                    </td>
                                    <td className={s.muted}>{u.createdAt.toLocaleDateString()}</td>
                                    <td>
                                        <ManageUserMenu
                                            userId={u.id}
                                            displayName={displayName(u)}
                                            currentRole={u.role}
                                            isSelf={u.id === callerId}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function UsersTableSkeleton() {
    return (
        <>
            <p className={s.subtitle} style={{ margin: "-12px 0 16px" }}>
                <Skeleton width={220} height={14} radius={4} />
            </p>
            <nav className={s.filterTabs}>
                {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} width={110} height={32} radius={8} />
                ))}
            </nav>
            <div className={s.tableWrap}>
                <table className={s.table}>
                    <thead>
                        <tr>
                            <th><Skeleton width={80} height={11} radius={4} /></th>
                            <th><Skeleton width={50} height={11} radius={4} /></th>
                            <th><Skeleton width={50} height={11} radius={4} /></th>
                            <th><Skeleton width={70} height={11} radius={4} /></th>
                            <th><Skeleton width={70} height={11} radius={4} /></th>
                            <th><Skeleton width={70} height={11} radius={4} /></th>
                            <th><Skeleton width={80} height={11} radius={4} /></th>
                            <th><Skeleton width={60} height={11} radius={4} /></th>
                            <th><Skeleton width={60} height={11} radius={4} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 6 }, (_, i) => (
                            <tr key={i}>
                                <td>
                                    <Skeleton width={160} height={14} radius={4} style={{ marginBottom: 4 }} />
                                    <Skeleton width={120} height={11} radius={4} />
                                </td>
                                <td><Skeleton width={90} height={22} radius={10} /></td>
                                <td><Skeleton width={100} height={12} radius={4} /></td>
                                <td className={s.numCol}><Skeleton width={28} height={13} radius={4} /></td>
                                <td className={s.numCol}><Skeleton width={28} height={13} radius={4} /></td>
                                <td className={s.numCol}><Skeleton width={28} height={13} radius={4} /></td>
                                <td><Skeleton width={80} height={12} radius={4} /></td>
                                <td><Skeleton width={80} height={12} radius={4} /></td>
                                <td><Skeleton width={30} height={20} radius={4} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function FilterTab({ label, value, active }: { label: string; value: string; active: boolean }) {
    return (
        <Link
            href={value === "ALL" ? "/tools/admin/dashboard/users" : `/tools/admin/dashboard/users?role=${value}`}
            className={`${s.filterTab} ${active ? s.filterTabActive : ""}`}
        >
            {label}
        </Link>
    );
}
