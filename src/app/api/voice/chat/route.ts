import { createClient } from "@deepgram/sdk";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

import { SCENARIOS } from "@/data/scenarios";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { message, scenarioId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        const scenario = SCENARIOS.find(s => s.id === scenarioId);
        const systemPrompt = scenario?.systemPrompt ||
            "You are a professional airline training instructor helping candidates improve spoken English. Keep your responses concise (1-2 sentences) and encouraging. You are talking over a voice interface, so be conversational.";

        // 1. Get AI Response
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `${systemPrompt}
                    
                    CRITICAL: You must return a valid JSON object with the following structure:
                    {
                      "reply": "The spoken response to the user",
                      "feedback": {
                        "score": 0-100 (integer, be strict based on aviation standards),
                        "pronunciation": "Good" | "Fair" | "Poor" (one word only),
                        "grammar_correction": "Corrected sentence if there was an error, otherwise null",
                        "suggestion": "A concise tip for improvement (max 10 words)"
                      }
                    }
                    `,
                },
                { role: "user", content: message },
            ],
            max_tokens: 300,
        });

        const rawContent = completion.choices[0].message.content;
        if (!rawContent) throw new Error("No response from AI");

        const aiResponse = JSON.parse(rawContent);
        const aiText = aiResponse.reply;

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
            audio: audioBase64,
            feedback: aiResponse.feedback
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
