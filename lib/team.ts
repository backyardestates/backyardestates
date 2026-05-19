// Backyard Estates leadership / team roster.
//
// Each entry's `portrait` is the filename inside /public/portraits.
// Set `portrait` to null (or omit) to hide that team member from any slide
// that renders this list — the Slide 12 "Our Team" grid filters them out.

export interface TeamMember {
    name: string;
    title: string;
    /** Filename inside /public/portraits. Falsy values cause the member to be omitted. */
    portrait?: string | null;
}

export const TEAM: TeamMember[] = [
    { name: "Adam Stewart",   title: "President & Founder",       portrait: "adam-stewart.png" },
    { name: "Tom Gibson",     title: "Director of Construction",  portrait: "tom-gibson.png" },
    { name: "Serge Mayer",    title: "Head Architect",            portrait: "serge-mayer.png" },
    { name: "Dusty Gravatt",  title: "Senior Construction Mgr.",  portrait: "dusty-gravatt.png" },
    { name: "Hector Tomas",   title: "Director of Finance",       portrait: "hector-tomas.png" },
    { name: "Jose Cervantes", title: "Project Manager",           portrait: "jose-cervantes.png" },
];

/** The list with portrait-less members removed. */
export function teamWithPortraits(): TeamMember[] {
    return TEAM.filter((m) => !!m.portrait);
}
