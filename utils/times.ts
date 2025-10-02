export default function formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(":").map(Number);

    // Create a new Date with today's date and the given time
    const date = new Date();
    date.setHours(hours, minutes);

    // Format with locale options
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}