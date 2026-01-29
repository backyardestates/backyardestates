"use client";

import styles from "./Finance.module.css";

export default function FinanceSlider({
    label,
    value,
    min,
    max,
    step,
    format,
    onChange,
    hint,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format?: (n: number) => string;
    onChange: (v: number) => void;
    hint?: string;
}) {
    return (
        <div className={styles.sliderWrap}>
            <div className={styles.sliderTop}>
                <label className={styles.label}>{label}</label>
                <div className={styles.sliderValue}>
                    {format ? format(value) : value}
                </div>
            </div>

            <input
                className={styles.slider}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />

            {hint ? <div className={styles.inputHint}>{hint}</div> : null}

            <div className={styles.sliderMinMax}>
                <span>{format ? format(min) : min}</span>
                <span>{format ? format(max) : max}</span>
            </div>
        </div>
    );
}
