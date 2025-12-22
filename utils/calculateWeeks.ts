export default function calculateWeeks(start?: string, end?: string) {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffWeeks = diffMs / (1000 * 60 * 60 * 24 * 7);

    return Math.ceil(diffWeeks);
}