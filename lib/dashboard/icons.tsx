/**
 * Maps the string `icon` keys in `registry.ts` to lucide-react components. Lives
 * apart from the registry so the registry stays pure data (serializable across
 * the server→client boundary); this module is imported locally by whichever
 * component renders an icon.
 */
import {
    Handshake,
    Ruler,
    FileText,
    FilePlus2,
    House,
    ShieldCheck,
    LayoutDashboard,
    Mic,
    Mail,
    type LucideIcon,
} from "lucide-react";

export const SECTION_ICONS: Record<string, LucideIcon> = {
    engagements: Handshake,
    fpa: Ruler,
    proposals: FileText,
    build: FilePlus2,
    feasibility: House,
    admin: ShieldCheck,
    dashboard: LayoutDashboard,
    consultation: Mic,
    drip: Mail,
};

/** Falls back to a neutral document icon so a missing key never crashes a render. */
export function sectionIcon(key: string): LucideIcon {
    return SECTION_ICONS[key] ?? FileText;
}
