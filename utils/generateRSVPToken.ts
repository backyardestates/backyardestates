// utils/generateRSVPToken.ts
import jwt, { JwtPayload } from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "super-secret"; // ⚠️ store in env file

export function generateRsvpToken(personId: string, email: string) {
    return jwt.sign(
        { personId, email },
        secret,
        { expiresIn: "30d" } // e.g. 30 days
    );
}

export function decodeRsvpToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, secret) as JwtPayload;
    } catch {
        return null;
    }
}
