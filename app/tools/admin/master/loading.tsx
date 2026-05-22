// Route-level skeleton — Next.js renders this immediately while page.tsx
// fetches Sanity + Prisma data on the server. Mirrors the master tool's
// 2-column layout (sidebar + main) so the visual jump on hydrate is small.

import { Skeleton } from "../../_components/Skeleton/Skeleton";
import s from "./loading.module.css";

export default function AdminMasterLoading() {
    return (
        <div className={s.shell} aria-busy="true">
            {/* Header bar */}
            <div className={s.header}>
                <Skeleton width={220} height={20} radius={6} />
                <div className={s.headerRight}>
                    <Skeleton width={80} height={32} radius={8} />
                    <Skeleton width={120} height={32} radius={8} />
                    <Skeleton width={140} height={32} radius={8} />
                </div>
            </div>

            <div className={s.body}>
                {/* Left sidebar — step nav */}
                <aside className={s.sidebar}>
                    <Skeleton width={90} height={11} radius={4} style={{ marginBottom: 14 }} />
                    {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className={s.sidebarRow}>
                            <Skeleton circle={24} />
                            <Skeleton height={12} radius={4} />
                        </div>
                    ))}
                </aside>

                {/* Main content — step cards */}
                <main className={s.main}>
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className={s.stepCard}>
                            <div className={s.stepHead}>
                                <Skeleton circle={28} />
                                <Skeleton width={180} height={18} radius={6} />
                            </div>
                            <div className={s.stepBody}>
                                <Skeleton height={14} radius={4} style={{ marginBottom: 10 }} />
                                <Skeleton height={14} radius={4} width="80%" />
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
}
