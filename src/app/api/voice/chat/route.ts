import { createClient } from "@deepgram/sdk";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

import { SCENARIOS } from "@/data/scenarios";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        try {
            const { message, history = [], scenarioId, ttsOnly } = await req.json();

            if (!message) {
                return NextResponse.json({ error: "Message required" }, { status: 400 });
            }

            let aiText = message;
            let aiResponse = { reply: message, feedback: null };

            if (!ttsOnly) {
                const scenario = SCENARIOS.find(s => s.id === scenarioId);
                const systemPrompt = scenario?.systemPrompt ||
                    "You are a professional airline training instructor helping candidates improve spoken English. Keep your responses concise (1-2 sentences) and encouraging. You are talking over a voice interface, so be conversational.";

                // Debug History
                console.log(`[Chat API] Scenario: ${scenarioId}, History Length: ${history.length}`);
                if (history.length > 0) {
                    console.log(`[Chat API] Last User Msg: ${message}`);
                }

                // 1. Get AI Response
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o", // Upgraded from mini for better adherence
                    temperature: 0.8, // Increased slightly for more natural convo
                    response_format: { type: "json_object" },
                    messages: [
                        {
                            role: "system",
                            content: `${systemPrompt}
                            
                            OUTPUT FORMAT (JSON):
                            {
                              "reply": "Your spoken response. MUST END WITH A QUESTION.",
                              "feedback": {
                                "score": 0-100,
                                "pronunciation": "Good" | "Fair" | "Poor",
                                "grammar_correction": "text" | null,
                                "suggestion": "text"
                              }
                            }
                            `,
                        },
                        ...history,
                        { role: "user", content: message },
                        { role: "system", content: "IMPORTANT: You are the interviewer. Do NOT repeat the user. Ask the next question now." }
                    ],
                    max_tokens: 350,
                });

                const rawContent = completion.choices[0].message.content;
                if (!rawContent) throw new Error("No response from AI");

                aiResponse = JSON.parse(rawContent);
                aiText = aiResponse.reply;
            }

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
