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
    pronunciation: string;
    grammar_correction: string | null;
    suggestion: string;
}

interface UseVoiceSessionProps {
    scenario: Scenario;
}

export function useVoiceSession({ scenario }: UseVoiceSessionProps) {
    const [state, setState] = useState<VoiceSessionState>("idle");
    const [transcript, setTranscript] = useState("");
    const [lastFeedback, setLastFeedback] = useState<Feedback | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const debugRef = useRef<string[]>([]);

    const addDebug = useCallback((msg: string) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const newEntry = `${timestamp} - ${msg}`;
        console.log(`[VoiceSession] ${msg}`);
        // Keep last 10 logs
        debugRef.current = [...debugRef.current.slice(-9), newEntry];
        setDebugInfo([...debugRef.current]);
    }, []);

    const deepgramRef = useRef<LiveClient | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<string[]>([]); // Queue of base64 audio chunks
    const pendingAudioRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);

    // Ref to track state in callbacks without re-binding
    const stateRef = useRef<VoiceSessionState>("idle");

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const playAudio = useCallback(async (base64Audio: string) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

            return new Promise<void>((resolve) => {
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

        const nextAudio = audioQueueRef.current.shift();
        if (nextAudio) {
            await playAudio(nextAudio);
        }

        isPlayingRef.current = false;
        addDebug("Audio finished");

        if (audioQueueRef.current.length > 0) {
            processAudioQueue();
        } else {
            setState("listening");
            addDebug("Returning to listening state");
        }
    }, [playAudio, addDebug]);

    const handleProcessing = useCallback(async (text: string) => {
        if (!text.trim()) return;

        setState("processing");
        addDebug("Processing with AI...");

        try {
            const res = await fetch("/api/voice/chat", {
                method: "POST",
                body: JSON.stringify({
                    message: text,
                    scenarioId: scenario.id
                }),
            });

            if (!res.ok) throw new Error("Chat processing failed");

            const data = await res.json();
            addDebug("AI response received");

            if (data.feedback) {
                setLastFeedback(data.feedback);
            }

            audioQueueRef.current.push(data.audio);
            processAudioQueue();

        } catch (err) {
            console.error("Processing error", err);
            setError("Failed to process speech");
            addDebug("AI Processing Failed");
            setState("listening");
        }
    }, [processAudioQueue, addDebug]);

    const startSession = useCallback(async () => {
        try {
            setState("listening");
            setError(null);
            setTranscript("");
            setLastFeedback(null);
            setDebugInfo([]);
            debugRef.current = [];
            audioQueueRef.current = [];

            addDebug("Starting session...");

            // 1. Get Token
            addDebug("Fetching Deepgram token...");
            const response = await fetch("/api/voice/token");
            if (!response.ok) throw new Error("Failed to get Deepgram token");
            const { key } = await response.json();
            addDebug("Token received");

            addDebug(`UA: ${navigator.userAgent}`);

            // 2. Setup Deepgram
            addDebug("Connecting to Deepgram...");
            const deepgram = createClient(key);

            // Minimal config to rule out parameter conflicts
            const connection = deepgram.listen.live({
                model: "nova-2",
                language: "en-US",
                smart_format: true,
                interim_results: true,
                utterance_end_ms: 4000,
                vad_events: true,
            });
            deepgramRef.current = connection;

            // 3. Setup Events
            connection.on(LiveTranscriptionEvents.Open, () => {
                addDebug("Deepgram Connection OPEN");

                // Flush pending audio
                if (pendingAudioRef.current.length > 0) {
                    addDebug(`Flushing ${pendingAudioRef.current.length} buffered chunks...`);
                    pendingAudioRef.current.forEach(chunk => {
                        connection.send(chunk);
                    });
                    pendingAudioRef.current = [];
                }

                connection.on(LiveTranscriptionEvents.Close, (e) => {
                    // @ts-ignore
                    addDebug(`Deepgram Connection CLOSED (Code: ${e?.code}, Reason: ${e?.reason})`);
                    // Stop recorder if socket dies to prevent spam
                    if (stateRef.current !== "idle") {
                        stopSession();
                    }
                });

                connection.on(LiveTranscriptionEvents.Metadata, (data) => {
                    addDebug(`Metadata received: ${JSON.stringify(data)}`);
                });

                connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                    const trans = data.channel.alternatives[0].transcript;
                    if (trans && data.is_final) {
                        addDebug(`Transcript: "${trans}"`);
                        if (stateRef.current === "listening") {
                            setTranscript((prev) => prev + " " + trans);

                            // Only auto-process if NOT in manual mode
                            if (!scenario.manualEndpointing) {
                                handleProcessing(trans);
                            }
                        }
                    }
                });

                connection.on(LiveTranscriptionEvents.Error, (err) => {
                    console.error("Deepgram error", err);
                    addDebug(`Deepgram Error: ${err.message}`);
                    setError("Voice connection error");
                });
            });

            // 4. Get Microphone
            addDebug("Requesting Microphone (Default Settings)...");
            // Use defaults - safer for browser compatibility
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            addDebug("Microphone Acquired");

            // Let browser pick optimal mimeType
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            addDebug(`Using MimeType: ${mediaRecorder.mimeType}`);

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const buffer = await event.data.arrayBuffer();
                    if (deepgramRef.current?.getReadyState() === 1) {
                        // Send immediately
                        deepgramRef.current.send(buffer);
                    } else {
                        // Buffer it! Don't drop it.
                        addDebug(`Buffering ${event.data.size} bytes (State: ${deepgramRef.current?.getReadyState()})`);
                        pendingAudioRef.current.push(buffer);
                    }
                }
            };

            mediaRecorder.onstart = () => addDebug("MediaRecorder: Start event fired");

            // KeepAlive mechanism
            const keepAliveInterval = setInterval(() => {
                if (deepgramRef.current?.getReadyState() === 1) {
                    deepgramRef.current.keepAlive();
                }
            }, 3000);

            mediaRecorder.onstop = () => {
                addDebug("MediaRecorder: Stop event fired");
                clearInterval(keepAliveInterval);
            };

            // 250ms chunks for balance of latency and header safety
            mediaRecorder.start(250);
            addDebug("MediaRecorder Started");

        } catch (err: any) {
            console.error(err);
            addDebug(`Error: ${err.message}`);
            setError(err.message || "Failed to start voice session");
            setState("idle");
        }
    }, [handleProcessing, addDebug]);

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

    const completeTurn = useCallback(() => {
        if (!transcript) return;
        addDebug("Manual Turn Completion");
        handleProcessing(transcript);
    }, [transcript, handleProcessing, addDebug]);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (stateRef.current !== "idle") {
                stopSession();
            }
        };
    }, [stopSession]);

    return {
        state,
        transcript,
        lastFeedback,
        error,
        startSession,
        stopSession,
        completeTurn,
        debugInfo
    };
}
