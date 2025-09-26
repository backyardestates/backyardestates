'use client';
import { useState, useRef, useEffect } from "react";
import styles from "./Select.module.css"

interface SelectProps {
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    options: { value: string; label: string }[]
}


export function Select({ value, onValueChange, placeholder, options }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [dropUp, setDropUp] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const selectedLabel =
        options.find((opt) => opt.value === value)?.label || placeholder || "Select..."

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)

            // Check space below the trigger
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect()
                const spaceBelow = window.innerHeight - rect.bottom
                setDropUp(spaceBelow < 200) // adjust 200px threshold based on dropdown height
            }
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    return (
        <div ref={wrapperRef} className={styles.selectWrapper}>
            {/* Trigger */}
            <button
                type="button"
                ref={triggerRef}
                className={styles.selectTrigger}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span>{selectedLabel}</span>
                <svg
                    className={`${styles.arrowIcon} ${isOpen ? styles.arrowOpen : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className={`${styles.selectDropdown} ${dropUp ? styles.dropUp : ""}`}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`${styles.selectItem} ${value === opt.value ? styles.selectItemSelected : ""
                                }`}
                            onClick={() => {
                                onValueChange(opt.value)
                                setIsOpen(false)
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

