import { createClient } from "@deepgram/sdk";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        // 1. Get AI Response
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a professional airline training instructor helping candidates improve spoken English. Keep your responses concise (1-2 sentences) and encouraging. You are talking over a voice interface, so be conversational.",
                },
                { role: "user", content: message },
            ],
            max_tokens: 150,
        });

        const aiText = completion.choices[0].message.content || "I didn't catch that.";

        // 2. Generate Audio with Deepgram Aura
        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        if (!deepgramApiKey) throw new Error("Deepgram API Key missing");

        const deepgram = createClient(deepgramApiKey);

        const response = await deepgram.speak.request(
            { text: aiText },
            { model: "aura-asteria-en" }
        );

        const stream = await response.getStream();

        if (!stream) {
            throw new Error("Failed to generate audio stream");
        }

        // Convert web stream to buffer
        const reader = stream.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const audioBuffer = Buffer.concat(chunks);
        const audioBase64 = audioBuffer.toString("base64");

        return NextResponse.json({
            text: aiText,
            audio: audioBase64
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
