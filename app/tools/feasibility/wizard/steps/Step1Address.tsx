"use client";

import { useFeasibilityStore } from "@/lib/feasibility/store";

export default function Step1Address() {
    const { name, phone, email, address, city, set } = useFeasibilityStore();

    return (
        <div>
            <p className="intro" style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-neutral-600)" }}>
                We already know 40–60% of what determines cost + timeline just from your address.
            </p>

            <label className="multistep">Name</label>
            <input className="multistep" type="text" value={name} onChange={(e) => set("name", e.target.value)} />

            <label className="multistep">Phone</label>
            <input className="multistep" type="text" value={phone} onChange={(e) => set("phone", e.target.value)} />

            <label className="multistep">Email</label>
            <input className="multistep" type="text" value={email} onChange={(e) => set("email", e.target.value)} />

            <label className="multistep">Property Address</label>
            <input className="multistep" type="text" value={address} onChange={(e) => set("address", e.target.value)} />

            <label className="multistep">City</label>
            <input className="multistep" type="text" value={city} onChange={(e) => set("city", e.target.value)} />
        </div>
    );
}
