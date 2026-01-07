import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    if (!deepgramApiKey) {
        return NextResponse.json(
            { error: "Deepgram API key not found" },
            { status: 500 }
        );
    }

    try {
        const deepgram = createClient(deepgramApiKey);

        // List projects to get the project ID (usually the first one)
        const { result: projectsResult, error: projectsError } =
            await deepgram.manage.getProjects();

        if (projectsError) {
            throw new Error(projectsError.message || "Unknown Deepgram project error");
        }

        const projectId = projectsResult.projects[0].project_id;

        // Create a temporary key
        const { result: keyResult, error: keyError } =
            await deepgram.manage.createProjectKey(projectId, {
                comment: "Ephemeral key for browser client",
                scopes: ["usage:write"],
                time_to_live_in_seconds: 60, // 1 minute
            });

        if (keyError) {
            throw keyError;
        }

        return NextResponse.json({
            key: keyResult.key,
        });
    } catch (error) {
        console.error("Deepgram Token Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
