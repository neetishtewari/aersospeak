import { createClient } from "@deepgram/sdk";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

import { SCENARIOS } from "@/data/scenarios";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
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

            // 1. Determine Phase (Assessment vs Interview) - 10 turns = 5 exchanges
            const isAssessmentPhase = history.length >= 10;

            const systemInstructions = isAssessmentPhase
                ? `STOP ASKING QUESTIONS. The interview is over. You must now generate a FINAL ASSESSMENT based on the user's performance.
                   Your "reply" should be a short closing statement (e.g., "Thank you, I've generated your feedback report below.").
                   You MUST populate the "assessment" object.`
                : systemPrompt;

            const jsonStructure = isAssessmentPhase
                ? `
                   {
                     "reply": "Short closing statement",
                     "assessment": {
                        "summary": "2-3 sentence overview of performance",
                        "score": 0-100,
                        "strengths": ["point 1", "point 2", "point 3"],
                        "improvements": ["point 1", "point 2", "point 3"]
                     },
                     "feedback": null
                   }
                  `
                : `
                   {
                      "reply": "Your spoken response. MUST END WITH A QUESTION.",
                      "feedback": {
                        "score": 0-100,
                        "pronunciation": "Good" | "Fair" | "Poor",
                        "grammar_correction": "text" | null,
                        "suggestion": "text"
                      }
                   }
                  `;

            // 1. Get AI Response
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                temperature: 0.8,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `${systemInstructions}
                        
                        OUTPUT FORMAT (JSON):
                        ${jsonStructure}
                        `,
                    },
                    ...history,
                    { role: "user", content: message },
                    {
                        role: "system",
                        content: isAssessmentPhase
                            ? "IMPORTANT: End the interview. Generate the assessment JSON."
                            : "IMPORTANT: You are the interviewer. Do NOT repeat the user. Ask the next question now."
                    }
                ],
                max_tokens: 500,
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
            feedback: aiResponse.feedback,
            assessment: aiResponse.assessment
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
