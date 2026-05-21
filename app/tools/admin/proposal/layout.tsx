// Auth gating is handled by middleware + the top-level /tools/layout.tsx nav.
// Pass-through; left in place for future per-route chrome.
export default function ProposalLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <>{children}</>;
}
