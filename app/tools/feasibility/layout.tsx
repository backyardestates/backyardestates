// Auth gating is handled by middleware + the top-level /tools/layout.tsx nav.
// This layout is now a pass-through; kept so future per-route chrome has a
// place to live without re-touching every consumer.
export default function FeasibilityLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <>{children}</>;
}
