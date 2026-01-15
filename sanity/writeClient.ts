import { createClient } from "next-sanity";

export const writeClient = createClient({
    projectId: "4sw2w31c",
    dataset: "production",
    apiVersion: "2025-07-25",
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
});
