"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    createClient,
    LiveClient,
    LiveTranscriptionEvents,
} from "@deepgram/sdk";

import { Scenario } from "@/data/scenarios";

export type VoiceSessionState = "idle" | "listening" | "processing" | "speaking";

export interface Feedback {
    score: number;
    pronunciation: "Good" | "Fair" | "Poor";
    grammar_correction: string | null;
    suggestion: string;
}

export interface Assessment {
    summary: string;
    score: number;
    qualification_likeliness: "Low" | "Medium" | "High" | "Very High";
    strengths: string[];
    improvements: string[];
}

interface UseVoiceSessionProps {
    scenario: Scenario;
}

export function useVoiceSession({ scenario }: UseVoiceSessionProps) {
    const [state, setState] = useState<VoiceSessionState>("idle");
    const [transcript, setTranscript] = useState("");
    const [lastFeedback, setLastFeedback] = useState<Feedback | null>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const debugRef = useRef<string[]>([]);

    // Refs
    const deepgramRef = useRef<LiveClient | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<string[]>([]);
    const pendingAudioRef = useRef<ArrayBuffer[]>([]);
    const historyRef = useRef<{ role: string; content: string }[]>([]);
    const isPlayingRef = useRef(false);
    const isUserSpeakingRef = useRef(false); // Track VAD state
    const transcriptPartsRef = useRef(""); // Buffer for turn logic

    // Ref to track state in callbacks without re-binding
    const stateRef = useRef<VoiceSessionState>("idle");

    const addDebug = useCallback((msg: string) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const newEntry = `${timestamp} - ${msg}`;
        console.log(`[VoiceSession] ${msg}`);
        // Keep last 10 logs
        debugRef.current = [...debugRef.current.slice(-9), newEntry];
        setDebugInfo([...debugRef.current]);
    }, []);

    const stopAudio = useCallback(() => {
        if (audioContextRef.current) {
            audioContextRef.current.suspend(); // Quickly stop playing
            audioContextRef.current.close().then(() => {
                audioContextRef.current = null;
            });
        }
        audioQueueRef.current = []; // Clear queue
        isPlayingRef.current = false;
        addDebug("Audio Playback Interrupted (Barge-in)");
    }, [addDebug]);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const playAudio = useCallback(async (base64Audio: string) => {
        try {
            // Re-create context if it was closed
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } else if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const ctx = audioContextRef.current;
            const audioData = atob(base64Audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }

            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);

            return new Promise<void>((resolve, reject) => {
                source.onended = () => {
                    resolve();
                };
                source.start(0);
            });

        } catch (err) {
            console.error("Audio playback error", err);
            addDebug(`Audio Playback Error: ${err}`);
        }
    }, [addDebug]);

    const processAudioQueue = useCallback(async () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

        isPlayingRef.current = true;
        setState("speaking");
        addDebug("Playing audio response...");

        // Process loop
        while (audioQueueRef.current.length > 0) {
            // If user is speaking, stop playback (Barge-in check)
            if (isUserSpeakingRef.current) {
                addDebug("User is speaking, aborting playback loop");
                stopAudio(); // Ensures context closed and queue cleared
                isPlayingRef.current = false;
                setState("listening");
                return;
            }

            const nextAudio = audioQueueRef.current.shift();
            if (nextAudio) {
                await playAudio(nextAudio);
            }
        }

        isPlayingRef.current = false;
        addDebug("Audio finished");
        setState("listening");
        addDebug("Returning to listening state");
    }, [playAudio, addDebug, stopAudio]);

    const handleProcessing = useCallback(async (text: string) => {
        if (!text.trim()) return;

        setState("processing");
        addDebug("Processing with AI...");

        try {
            const history = historyRef.current;

            const res = await fetch("/api/voice/chat", {
                method: "POST",
                body: JSON.stringify({
                    message: text,
                    history: history,
                    scenarioId: scenario.id
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                addDebug(`Server Error: ${errorData.error || res.statusText}`);
                throw new Error(errorData.error || "Chat processing failed");
            }

            const data = await res.json();
            addDebug("AI response received");

            historyRef.current.push({ role: "user", content: text });
            historyRef.current.push({ role: "assistant", content: data.text });

            if (data.feedback) {
                setLastFeedback(data.feedback);
            }

            if (data.assessment) {
                setAssessment(data.assessment);
                addDebug("Final Assessment Received");
            }

            // Only queue if user is NOT speaking
            if (!isUserSpeakingRef.current) {
                audioQueueRef.current.push(data.audio);
                processAudioQueue();
            } else {
                addDebug("Audio discarded - User is speaking");
            }

        } catch (err) {
            console.error("Processing error", err);
            setError("Failed to process speech");
            addDebug("AI Processing Failed");
            setState("listening");
        }
    }, [processAudioQueue, addDebug, scenario.id]);

    const stopSession = useCallback(() => {
        addDebug("Stopping session...");
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            mediaRecorderRef.current = null;
        }

        if (deepgramRef.current) {
            deepgramRef.current.finish();
            deepgramRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setState("idle");
        addDebug("Session Stopped");
    }, [addDebug]);

    const startSession = useCallback(async () => {
        try {
            setState("listening");
            setError(null);
            setTranscript("");
            setLastFeedback(null);
            setDebugInfo([]);
            debugRef.current = [];
            audioQueueRef.current = [];
            historyRef.current = [];
            isUserSpeakingRef.current = false;

            addDebug("Starting session...");

            addDebug("Fetching Deepgram token...");
            const response = await fetch("/api/voice/token");
            if (!response.ok) throw new Error("Failed to get Deepgram token");
            const { key } = await response.json();
            addDebug("Token received");

            addDebug(`UA: ${navigator.userAgent}`);

            addDebug("Connecting to Deepgram...");
            const deepgram = createClient(key);

            const connection = deepgram.listen.live({
                model: "nova-2",
                language: "en-US",
                smart_format: true,
                interim_results: true,
                utterance_end_ms: scenario.silenceTimeoutMs || 2000,
                vad_events: true, // Needed for SpeechStarted
            });
            addDebug(`VAD Timeout set to: ${scenario.silenceTimeoutMs || 2000}ms`);
            deepgramRef.current = connection;

            connection.on(LiveTranscriptionEvents.Open, async () => {
                addDebug("Deepgram Connection OPEN");

                if (pendingAudioRef.current.length > 0) {
                    addDebug(`Flushing ${pendingAudioRef.current.length} buffered chunks...`);
                    pendingAudioRef.current.forEach(chunk => {
                        connection.send(chunk);
                    });
                    pendingAudioRef.current = [];
                }

                if (scenario.initialMessage) {
                    addDebug("Requesting Initial Greeting...");
                    (async () => {
                        try {
                            const res = await fetch("/api/voice/chat", {
                                method: "POST",
                                body: JSON.stringify({
                                    message: scenario.initialMessage,
                                    ttsOnly: true,
                                    scenarioId: scenario.id
                                }),
                            });
                            if (res.ok) {
                                const data = await res.json();
                                // Only queue if user is NOT speaking
                                if (deepgramRef.current && !isUserSpeakingRef.current) {
                                    audioQueueRef.current.push(data.audio);
                                    processAudioQueue();
                                    historyRef.current.push({ role: "assistant", content: scenario.initialMessage });
                                }
                            } else {
                                const err = await res.json().catch(() => ({}));
                                addDebug(`Greeting Error: ${err.error || res.statusText}`);
                            }
                        } catch (e: any) {
                            console.error("Failed to play greeting", e);
                            addDebug(`Greeting Failed: ${e.message}`);
                        }
                    })();
                }

                connection.on(LiveTranscriptionEvents.Close, (e) => {
                    // @ts-ignore
                    addDebug(`Deepgram Connection CLOSED (Code: ${e?.code}, Reason: ${e?.reason})`);
                    if (stateRef.current !== "idle") {
                        stopSession();
                    }
                });

                connection.on(LiveTranscriptionEvents.Metadata, (data) => {
                    addDebug(`Metadata received: ${JSON.stringify(data)}`);
                });

                connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
                    addDebug(">> SPEECH STARTED (Potential Barge-in)");
                    // Don't stop immediately. Wait for some text to be sure it's not noise/echo.
                    isUserSpeakingRef.current = true;
                });

                connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
                    addDebug(">> UTTERANCE END");
                    isUserSpeakingRef.current = false;

                    // Processing Logic: Use accumulated buffer if available, otherwise use accumulated transcript
                    const finalBuffer = transcriptPartsRef.current.trim();
                    if (finalBuffer && stateRef.current === 'listening' && !scenario.manualEndpointing) {
                        addDebug(`Processing buffered transcript: "${finalBuffer}"`);
                        handleProcessing(finalBuffer);
                        transcriptPartsRef.current = ""; // Clear buffer
                        // Optional: You might want to clear main transcript or keep it. 
                        // Currently we keep main transcript for display but process the "turn".
                    }
                });

                connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                    const trans = data.channel.alternatives[0].transcript;

                    // BARGE-IN CHECK: If we get ANY transcript text while speaking, stop!
                    if (trans && trans.trim().length > 0) {
                        // Check if we need to interrupt
                        if (stateRef.current === 'speaking' || isPlayingRef.current) {
                            addDebug(`>> INTERRUPTING: "${trans.substring(0, 15)}..."`);
                            stopAudio();
                            setState("listening");
                            isUserSpeakingRef.current = true;
                        }
                    }

                    if (trans && data.is_final) {
                        addDebug(`Transcript (Final Chunk): "${trans}"`);

                        // If we have a final transcript, user finished a phrase
                        isUserSpeakingRef.current = false;

                        if (stateRef.current !== "listening") {
                            setState("listening");
                        }

                        if (stateRef.current === "listening") {
                            // Accumulate into buffer for processing
                            transcriptPartsRef.current += " " + trans;
                            setTranscript((prev) => prev + " " + trans);

                            // DO NOT trigger handleProcessing here anymore. Wait for UtteranceEnd.
                        }
                    }
                });

                connection.on(LiveTranscriptionEvents.Error, (err) => {
                    console.error("Deepgram error", err);
                    addDebug(`Deepgram Error: ${err.message}`);
                    setError("Voice connection error");
                });
            });

            addDebug("Requesting Microphone...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            addDebug("Microphone Acquired");

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            addDebug(`Using MimeType: ${mediaRecorder.mimeType}`);

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const buffer = await event.data.arrayBuffer();
                    if (deepgramRef.current?.getReadyState() === 1) {
                        deepgramRef.current.send(buffer);
                    } else {
                        addDebug(`Buffering ${event.data.size} bytes (State: ${deepgramRef.current?.getReadyState()})`);
                        pendingAudioRef.current.push(buffer);
                    }
                }
            };

            mediaRecorder.onstart = () => addDebug("MediaRecorder: Start event fired");

            const keepAliveInterval = setInterval(() => {
                if (deepgramRef.current?.getReadyState() === 1) {
                    try {
                        deepgramRef.current.keepAlive();
                    } catch (e) {
                        // ignore keepalive errors
                    }
                }
            }, 3000);

            mediaRecorder.onstop = () => {
                addDebug("MediaRecorder: Stop event fired");
                clearInterval(keepAliveInterval);
            };

            mediaRecorder.start(250);
            addDebug("MediaRecorder Started");

        } catch (err: any) {
            console.error(err);
            addDebug(`Error: ${err.message}`);
            setError(err.message || "Failed to start voice session");
            setState("idle");
        }
    }, [handleProcessing, addDebug, scenario, stopSession, processAudioQueue, stopAudio]);

    const completeTurn = useCallback(() => {
        if (!transcript) return;
        addDebug("Manual Turn Completion");
        handleProcessing(transcript);
    }, [transcript, handleProcessing, addDebug]);

    useEffect(() => {
        return () => {
            if (stateRef.current !== "idle") {
                stopSession();
            }
        };
    }, [stopSession]);

    return {
        state,
        transcript,
        lastFeedback,
        assessment,
        error,
        startSession,
        stopSession,
        completeTurn,
        debugInfo
    };
}
