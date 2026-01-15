export default function Step4Comparison() {
    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ padding: "1rem", border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)" }}>
                <p style={{ fontWeight: 700, marginBottom: ".5rem" }}>Without Formal Property Analysis</p>
                <ol>
                    <li>Guess pricing</li>
                    <li>Timeline shifts</li>
                    <li>Change orders</li>
                    <li>Hidden constraints</li>
                    <li>Contractor chaos</li>
                </ol>
            </div>

            <div style={{ padding: "1rem", border: "2px solid var(--color-neutral-100)", borderRadius: "var(--radius)" }}>
                <p style={{ fontWeight: 700, marginBottom: ".5rem" }}>With Formal Property Analysis</p>
                <ol>
                    <li>Locked pricing</li>
                    <li>Fixed timeline</li>
                    <li>Near-zero change orders</li>
                    <li>All constraints resolved</li>
                    <li>Turnkey execution</li>
                </ol>
            </div>

            <p style={{ color: "var(--color-brand-dark-blue)", fontWeight: 700 }}>
                Any number given without this analysis is marketing — not construction.
            </p>
        </div>
    );
}
