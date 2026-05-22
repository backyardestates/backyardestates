let googleMapsPromise: Promise<void> | null = null;

type LoadGoogleMapsOpts = {
    apiKey: string;
    language?: string;
    region?: string;
};

export function loadGoogleMaps({ apiKey, language = "en", region = "US" }: LoadGoogleMapsOpts) {
    if (typeof window === "undefined") return Promise.reject(new Error("Must run in browser"));
    if (!apiKey) return Promise.reject(new Error("Missing Google Maps API key"));

    // already loaded
    if ((window as any).google?.maps?.importLibrary) return Promise.resolve();

    // in-flight
    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById("google-maps-js");
        if (existing) {
            // If script tag exists but google isn't ready yet, wait for it.
            const check = () => {
                if ((window as any).google?.maps?.importLibrary) resolve();
                else setTimeout(check, 30);
            };
            check();
            return;
        }

        const script = document.createElement("script");
        script.id = "google-maps-js";
        script.async = true;
        script.defer = true;

        // Note: no `libraries=` needed when using importLibrary, but it’s harmless either way.
        // Keep it minimal and rely on importLibrary below.
        script.src =
            `https://maps.googleapis.com/maps/api/js` +
            `?key=${encodeURIComponent(apiKey)}` +
            `&v=weekly` +
            `&language=${encodeURIComponent(language)}` +
            `&region=${encodeURIComponent(region)}`;

        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Maps script"));

        document.head.appendChild(script);
    });

    return googleMapsPromise;
}
