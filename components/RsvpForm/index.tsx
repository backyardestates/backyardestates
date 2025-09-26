"use client"

import React, { useEffect, useRef } from "react"

import { useState } from "react"
import styles from "./RSVPForm.module.css"
import { CalendarDays, Clock, Users, Minus, Plus, CalendarPlus2 } from "lucide-react"
import formatDate from "@/utils/dates"
import { isValidUSPhone } from "@/utils/isValidUSPhone"
import { Select } from "../Select"
import { useRouter } from "next/navigation"

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



interface BadgeProps {
    children: React.ReactNode
}


export function Badge({ children }: BadgeProps) {
    return <div className={`${styles.badge}`}>{children}</div>
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

    const router = useRouter()

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






    // For this example, using Friday+Saturday configuration
    const eventDates = dates.length > 1 ? eventConfigs.fridaySaturday : eventConfigs.saturdayOnly

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


    async function createPerson(fd) {
        console.log("FormData:", Object.fromEntries(fd.entries()));

        const rawDate = fd.get("date") as string | null;
        let stage_id: number | null = null;

        if (rawDate) {
            const dateObj = new Date(rawDate); // assumes `selectedDate` is an ISO-like string ("2025-09-26")
            const day = dateObj.getDay();
            // getDay(): Sunday = 0, Monday = 1, ..., Friday = 5, Saturday = 6

            if (day === 4) {
                // Friday
                stage_id = 76; // replace with your Friday stage_id
            } else if (day === 5) {
                // Saturday
                stage_id = 77; // replace with your Saturday stage_id
            }
        }
        console.log(stage_id)

        const person = {
            name: `${fd.get("firstName")} ${fd.get("lastName")}`,
            email: [{ value: fd.get("email") }],
            phone: [{ value: fd.get("phone") }],
            '733d97610511293c521189a69a776c732bae881c': 'subscribed',
            '3397c6015c59f81b73082a78efb98a6bcc88b258': 'subscribed'
        }

        const lead = {
            name: `${fd.get("firstName")} ${fd.get("lastName")}`,
            firstname: fd.get("firstName"),
            lastname: fd.get("lastName"),
            email: [{ value: fd.get("email") }],
            phone: [{ value: fd.get("phone") }],
            hearAbout: fd.get("hearAbout"),
            ticketCount: fd.get("ticketCount"),
            time: fd.get("time"),
            date: fd.get("date"),
            stage_id: stage_id

        }
        try {
            const res = await fetch('/api/pipedrive/create-person', {
                method: 'POST',
                body: JSON.stringify({ person }),
                headers: { 'Content-Type': 'application/json' },
            })

            const personCreated = await res.json()

            if (personCreated.success) {
                submitLead(personCreated, lead)
            }
        } catch (error) {
            console.log('Error creating person:', error)
        }
    }

    async function submitLead(person, lead) {
        let hearAboutNumber = 0

        switch (lead.hearAbout) {
            case 'mailer':
                hearAboutNumber = 87
                break
            case 'facebook':
                hearAboutNumber = 88
                break
            case 'instagram':
                hearAboutNumber = 89
                break
            case 'tiktok':
                hearAboutNumber = 90
                break
            case 'youtube':
                hearAboutNumber = 91
                break
            case 'google-search':
                hearAboutNumber = 92
                break
            case 'friend-referral':
                hearAboutNumber = 93
                break
            case 'other':
                hearAboutNumber = 94
                break
            default:
                hearAboutNumber = 56
        }

        const submittedLead = {
            title: `${lead.firstname} ${lead.lastname}`,
            person_id: person.data.data.id,
            // prettier-ignore
            '17e454fc34bb628afc178609b1ef3295c7152877': lead.ticketCount,
            // prettier-ignore
            'e37e48f6d0da66dc4e54ba571bc3796091a92be4': lead.time,
            // prettier-ignore
            '99c3c4c83c70de6cc3d999b6f2692bb4b59b2036': lead.date,
            // prettier-ignore
            'd51817980c84eec68d862509ea6cc9fd58d2c2c9': hearAboutNumber,
            pipeline_id: 7,
            stage_id: lead.stage_id
        }

        console.log(submittedLead)
        try {
            const leadRes = await fetch('/api/pipedrive/submit-lead', {
                method: 'POST',
                body: JSON.stringify({ submittedLead }),
                headers: { 'Content-Type': 'application/json' },
            })

            const leadData = await leadRes.json()

            if (leadData.success) {
                router.push(`/?rsvp=success`)
            }
        } catch (error) {
            console.log('Error submitting lead:', error)
        }
    }


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
            const fd = new FormData();
            fd.append("firstName", formData.firstName);
            fd.append("lastName", formData.lastName);
            fd.append("email", formData.email);
            fd.append("phone", formData.phone);
            fd.append("hearAbout", formData.hearAbout);
            fd.append("date", selectedDate ?? "");
            fd.append("time", selectedDate ? (selectedTimes[selectedDate] ?? "") : "");
            fd.append("ticketCount", ticketCount.toString());
            createPerson(fd);
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
                                    { value: "mailer", label: "Mailer" },
                                    { value: "facebook", label: "Facebook" },
                                    { value: "instagram", label: "Instagram" },
                                    { value: "tiktok", label: "TikTok" },
                                    { value: "youtube", label: "Youtube" },
                                    { value: "google-search", label: "Google Search" },
                                    { value: "friend-referral", label: "Friend/Family Referral" },
                                    { value: "other", label: "Other" },
                                ]}
                            />
                            {errors.hearAbout && <span role="alert" className={styles.errorText}>{errors.hearAbout}</span>}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={!isFormValid} className={styles.submitButton}>
                        RSVP Now
                    </Button>
                </form>

            </CardContent>
        </Card>
    )
}
