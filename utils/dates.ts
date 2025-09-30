export default function formatDate(dateString: string): string {
    const [year, month, day] = dateString.split("-").map(Number);
    const d = new Date(year, month - 1, day); // month is 0-indexed
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long", // full month name
        day: "2-digit",
    })
}