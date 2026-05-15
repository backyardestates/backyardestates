"use client";

type Props = {
    theme: "dark" | "light";
    left?: React.ReactNode;
    right?: React.ReactNode;
    center?: React.ReactNode;
};

export function RunningFooter({ theme, left, right, center }: Props) {
    const hasExtras = left || right || center;

    if (!hasExtras) {
        return (
            <div className={`running-footer running-footer-${theme}`} style={{ justifyContent: "flex-end" }}>
                <span className="running-footer-tagline">We build for you.</span>
            </div>
        );
    }

    return (
        <div className={`running-footer running-footer-${theme}`} style={{ justifyContent: "space-between" }}>
            <span>{left}</span>
            {center && <span style={{ textAlign: "center" }}>{center}</span>}
            <span className="running-footer-tagline">{right ?? "We build for you."}</span>
        </div>
    );
}
