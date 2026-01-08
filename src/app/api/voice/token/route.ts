import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    if (!deepgramApiKey) {
        console.error("Deepgram Token Error: API Key is missing in env");
        return NextResponse.json(
            { error: "Deepgram API key not found" },
            { status: 500 }
        );
    }

    // TODO: [SECURITY] Revert to ephemeral key generation when we have an Admin key.
    // Currently returning the main key directly to bypass scope/permission issues.

    return NextResponse.json({
        key: deepgramApiKey,
    });
}
