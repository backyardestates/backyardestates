// Audio → transcript. Default provider is Deepgram's prerecorded REST endpoint
// (a single authenticated POST — no SDK dependency). Swap the provider here if
// the team later standardizes on AssemblyAI / Whisper; callers only see
// `transcribeAudio`.

export function isTranscriptionConfigured(): boolean {
    return !!process.env.DEEPGRAM_API_KEY;
}

export async function transcribeAudio(
    audio: ArrayBuffer,
    contentType: string,
): Promise<string> {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) {
        throw new Error(
            "DEEPGRAM_API_KEY is not set. Set it to transcribe audio, or paste/upload a transcript instead.",
        );
    }

    const params = new URLSearchParams({
        model: "nova-3",
        smart_format: "true",
        punctuate: "true",
        diarize: "true",
    });

    const res = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
        method: "POST",
        headers: {
            Authorization: `Token ${key}`,
            "Content-Type": contentType || "audio/webm",
        },
        body: Buffer.from(audio),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Transcription failed (${res.status})${text ? `: ${text}` : ""}`);
    }

    const data = (await res.json()) as {
        results?: {
            channels?: { alternatives?: { transcript?: string }[] }[];
        };
    };
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript || !transcript.trim()) {
        throw new Error("Transcription returned empty text — the audio may be silent or unsupported.");
    }
    return transcript;
}
