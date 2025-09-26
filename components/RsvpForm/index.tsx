"use client"

import React, { useEffect, useRef } from "react"

import type { ReactElement } from "react"
import { useState } from "react"
import styles from "./RSVPForm.module.css"
import { CalendarDays, Clock, Users, Minus, Plus, CalendarPlus2 } from "lucide-react"
import formatDate from "@/utils/dates"

function cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes.filter(Boolean).join(" ")
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
}

function Button({ className, children, ...props }: ButtonProps) {
    return (
        <button className={className} {...props}>
            {children}
        </button>
    )
}

interface CardProps {
    className?: string
    children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
    return <div className={`${styles.card} ${className || ''}`}>{children}</div>
}

export function CardHeader({ className, children }: CardProps) {
    return <div className={`${styles.header} ${className || ''}`}>{children}</div>
}

export function CardTitle({ className, children }: CardProps) {
    return <h3 className={`${styles.title} ${className || ''}`}>{children}</h3>
}

export function CardContent({ className, children }: CardProps) {
    return <div className={`${styles.content} ${className || ''}`}>{children}</div>
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function Input({ className, ...props }: InputProps) {
    return <input className={`${styles.input} ${className || ''}`} {...props} />
}


interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { }

export function Label({ className, ...props }: LabelProps) {
    return <label className={`${styles.label} ${className || ''}`} {...props} />
}

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



interface BadgeProps {
    children: React.ReactNode
}


export function Badge({ children }: BadgeProps) {

    return <div className={`${styles.badge}`}>{children}</div>
}


interface EventDate {
    day: string
    date: string
    times: string[]
}


interface EventDates {
    dates: string[];
}

export function RSVPForm({ dates }: EventDates) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedTimes, setSelectedTimes] = useState<Record<string, string>>({})
    const [ticketCount, setTicketCount] = useState(1)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        hearAbout: "",
    })

    // Example event configurations - you can modify these based on your actual events
    const eventConfigs = {
        fridaySaturday: [
            {
                day: "Friday",
                date: dates[0],
                times: [
                    "10:00 AM",
                    "10:30 AM",
                    "11:00 AM",
                    "11:30 AM",
                    "12:00 PM",
                    "12:30 PM",
                    "1:00 PM",
                    "1:30 PM",
                    "2:00 PM",
                    "2:30 PM",
                    "3:00 PM",
                    "3:30 PM",
                    "4:00 PM",
                    "4:30 PM",
                    "5:00 PM",
                    "5:30 PM",
                    "6:00 PM",
                ],
            },
            {
                day: "Saturday",
                date: dates[1],
                times: [
                    "9:00 AM",
                    "9:30 AM",
                    "10:00 AM",
                    "10:30 AM",
                    "11:00 AM",
                    "11:30 AM",
                    "12:00 PM",
                    "12:30 PM",
                    "1:00 PM",
                    "1:30 PM",
                    "2:00 PM",
                ],
            },
        ],
        saturdayOnly: [
            {
                day: "Saturday",
                date: dates[0],
                times: [
                    "9:00 AM",
                    "9:30 AM",
                    "10:00 AM",
                    "10:30 AM",
                    "11:00 AM",
                    "11:30 AM",
                    "12:00 PM",
                    "12:30 PM",
                    "1:00 PM",
                    "1:30 PM",
                    "2:00 PM",
                ],
            },
        ],
    }


    const isValidUSPhone = (phone: string) => {
        // Remove all spaces, parentheses, dots, and dashes for digit count check
        const digitsOnly = phone.replace(/\D/g, '')

        // Must be exactly 10 digits (area code + number) or 11 with leading 1
        if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
            return true
        }

        return false
    }



    // For this example, using Friday+Saturday configuration
    const eventDates = dates.length > 0 ? eventConfigs.fridaySaturday : eventConfigs.saturdayOnly

    const handleDateToggle = (date: string) => {
        setSelectedDate((prev) => {
            // If the same date is clicked, deselect it
            if (prev === date) {
                setSelectedTimes((prevTimes) => {
                    const newTimes = { ...prevTimes }
                    delete newTimes[date]
                    return newTimes
                })
                return null
            }

            // If switching to a new date, clear the old one’s times
            if (prev) {
                setSelectedTimes((prevTimes) => {
                    const newTimes = { ...prevTimes }
                    delete newTimes[prev]
                    return newTimes
                })
            }

            return date
        })
    }

    const handleTimeToggle = (date: string, time: string) => {
        setSelectedTimes((prev) => {
            const current = prev[date]
            // if same time clicked -> deselect (remove the key)
            if (current === time) {
                const copy = { ...prev }
                delete copy[date]
                return copy
            }
            // otherwise set this time (replace any previous)
            return { ...prev, [date]: time }
        })
    }


    const handleTicketChange = (increment: boolean) => {
        setTicketCount((prev) => {
            if (increment && prev < 6) return prev + 1
            if (!increment && prev > 1) return prev - 1
            return prev
        })
    }

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear the error for this field as the user types
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = { ...errors };

        if (!selectedDate) {
            newErrors.date = "Please select a date";
        } else if (!selectedTimes[selectedDate]) {
            // Only check time if a date is selected
            newErrors.time = "Please select a time slot";
        }

        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required";
        if (!formData.hearAbout) newErrors.hearAbout = "Please select an option";
        if (!formData.phone || !isValidUSPhone(formData.phone)) {
            newErrors.phone = "Please enter a valid US phone number"
        }

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some((v) => v);
        if (!hasError) {
            e.preventDefault()
            alert("RSVP submitted successfully!")
        }
    };


    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        hearAbout: "",
        date: "",
        time: "",
    });

    const isFormValid =
        !!selectedDate &&
        (selectedTimes[selectedDate]?.length ?? 0) > 0 &&
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.phone &&
        formData.hearAbout

    return (
        <Card className={styles.card}>
            <CardHeader>
                <CardTitle className={styles.cardTitleFlex}>
                    <CalendarDays />
                    Reserve Your Spot
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className={styles.spaceY4} noValidate>
                    {/* Date Selection */}
                    <div className={styles.spaceY4}>
                        <div className={styles.flexCenterGap2}>
                            <Badge>1</Badge>
                            <h3 className={cn(styles.textLg, styles.fontSemibold, styles.flexCenterGap2)}>
                                Select Event Date <CalendarPlus2 />
                            </h3>
                        </div>

                        <div className={styles.gridGap3} role="group" aria-label="Event dates">
                            {eventDates.map((eventDate) => (
                                <button
                                    key={eventDate.date}
                                    type="button"
                                    onClick={() => handleDateToggle(eventDate.date)}
                                    className={`${styles.dateButton} ${selectedDate === eventDate.date ? styles.dateButtonSelected : ""}`}
                                    aria-pressed={selectedDate === eventDate.date}
                                >
                                    <div>{eventDate.day}</div>
                                    <div>{formatDate(eventDate.date)}</div>
                                    <div>{eventDate.day === "Friday" ? "10 AM - 6 PM" : "9 AM - 2 PM"}</div>
                                </button>
                            ))}
                        </div>
                        {errors.date && <span role="alert" className={styles.errorText}>{errors.date}</span>}
                    </div>

                    {/* Time Selection */}

                    <div className={styles.flexCenterGap2}>
                        <Badge>2</Badge>
                        <h3 className={cn(styles.textLg, styles.fontSemibold, styles.flexCenterGap2)}>
                            Select Time Slot <Clock />
                        </h3>
                    </div>
                    <div
                        className={`${styles.timeSlotsWrapper} ${selectedDate ? styles.timeSlotsVisible : ''}`}
                    >
                        {selectedDate && (
                            <div className={`${styles.timeSlotsWrapper} ${styles.timeSlotsVisible}`} role="group" aria-label="Time slots">
                                {(() => {
                                    const eventDate = eventDates.find((d) => d.date === selectedDate)
                                    if (!eventDate) return null

                                    return (
                                        <div className={styles.spaceY3}>
                                            <div className={styles.gridCols3}>
                                                {eventDate.times.map((time) => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => handleTimeToggle(selectedDate, time)}
                                                        className={`${styles.timeButton} ${selectedTimes[selectedDate] === time ? styles.timeButtonSelected : ""
                                                            }`}
                                                        aria-pressed={selectedTimes[selectedDate] === time}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.time && <span role="alert" className={styles.errorText}>{errors.time}</span>}
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Ticket Count */}
                    <div className={styles.spaceY4}>
                        <div className={styles.flexCenterGap2}>
                            <Badge>3</Badge>
                            <h3 className={cn(styles.textLg, styles.fontSemibold, styles.flexCenterGap2)}>
                                Number of Tickets <Users />
                            </h3>
                        </div>

                        <div className={styles.flexCenterGap4}>
                            <Button
                                type="button"
                                onClick={() => handleTicketChange(false)}
                                disabled={ticketCount <= 1}
                                className={styles.ticketButton}
                                aria-label="Decrease ticket count"
                            >
                                <Minus />
                            </Button>

                            <span className={styles.ticketCountText} aria-live="polite">{ticketCount}</span>

                            <Button
                                type="button"
                                onClick={() => handleTicketChange(true)}
                                disabled={ticketCount >= 6}
                                className={styles.ticketButton}
                                aria-label="Increase ticket count"
                            >
                                <Plus />
                            </Button>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className={styles.spaceY4}>
                        <div className={styles.flexCenterGap2}>
                            <Badge>4</Badge>
                            <h3 className={cn(styles.textLg, styles.fontSemibold)}>Your Information</h3>
                        </div>

                        <div className={styles.gridCols2}>
                            <div className={styles.spaceY2}>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    autoComplete="given-name"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    placeholder="e.g. John"
                                    required
                                    aria-invalid={!!errors.firstName}
                                    className={errors.firstName ? styles.inputError : ""}
                                />
                                {errors.firstName && <span role="alert" className={styles.errorText}>{errors.firstName}</span>}
                            </div>

                            <div className={styles.spaceY2}>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    autoComplete="family-name"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    placeholder="e.g. Smith"
                                    required
                                    aria-invalid={!!errors.lastName}
                                    className={errors.lastName ? styles.inputError : ""}
                                />
                                {errors.lastName && <span role="alert" className={styles.errorText}>{errors.lastName}</span>}
                            </div>
                        </div>

                        <div className={styles.gridCols2}>
                            <div className={styles.spaceY2}>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    placeholder="e.g. john@smith.com"
                                    required
                                    aria-invalid={!!errors.email}
                                    className={errors.email ? styles.inputError : ""}
                                />
                                {errors.email && <span role="alert" className={styles.errorText}>{errors.email}</span>}
                            </div>

                            <div className={styles.spaceY2}>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    placeholder="e.g. (909 123 1234)"
                                    required
                                    aria-invalid={!!errors.phone}
                                    className={errors.phone ? styles.inputError : ""}
                                />
                                {errors.phone && <span role="alert" className={styles.errorText}>{errors.phone}</span>}
                            </div>
                        </div>

                        <div className={styles.spaceY2}>
                            <Label htmlFor="hearAbout">How did you hear about us?</Label>
                            <Select
                                value={formData.hearAbout}
                                onValueChange={(value) => handleInputChange("hearAbout", value)}
                                placeholder="Select an option"
                                aria-label="How did you hear about us"
                                options={[
                                    { value: "social-media", label: "Social Media" },
                                    { value: "google-search", label: "Google Search" },
                                    { value: "friend-referral", label: "Friend/Family Referral" },
                                    { value: "real-estate-agent", label: "Real Estate Agent" },
                                    { value: "newspaper", label: "Newspaper/Magazine" },
                                    { value: "radio", label: "Radio" },
                                    { value: "other", label: "Other" },
                                ]}
                            />
                            {errors.hearAbout && <span role="alert" className={styles.errorText}>{errors.hearAbout}</span>}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={!isFormValid} className={styles.submitButton}>
                        Confirm My Attendance
                    </Button>
                </form>

            </CardContent>
        </Card>
    )
}
