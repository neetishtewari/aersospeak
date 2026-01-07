"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    createClient,
    LiveClient,
    LiveTranscriptionEvents,
} from "@deepgram/sdk";

export type VoiceSessionState = "idle" | "listening" | "processing" | "speaking";

export function useVoiceSession() {
    const [state, setState] = useState<VoiceSessionState>("idle");
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);

    const deepgramRef = useRef<LiveClient | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<string[]>([]); // Queue of base64 audio chunks
    const isPlayingRef = useRef(false);

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
        }
    }, []);

    const processAudioQueue = useCallback(async () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

        isPlayingRef.current = true;
        setState("speaking");

        const nextAudio = audioQueueRef.current.shift();
        if (nextAudio) {
            await playAudio(nextAudio);
        }

        isPlayingRef.current = false;

        if (audioQueueRef.current.length > 0) {
            processAudioQueue();
        } else {
            setState("listening");
        }
    }, [playAudio]);

    // Ref to track state in callbacks without re-binding
    const stateRef = useRef<VoiceSessionState>("idle");

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const handleProcessing = useCallback(async (text: string) => {
        if (!text.trim()) return;

        setState("processing");

        try {
            const res = await fetch("/api/voice/chat", {
                method: "POST",
                body: JSON.stringify({ message: text }),
            });

            if (!res.ok) throw new Error("Chat processing failed");

            const data = await res.json();
            // data.audio is base64

            // Queue audio
            audioQueueRef.current.push(data.audio);
            processAudioQueue();

        } catch (err) {
            console.error("Processing error", err);
            setError("Failed to process speech");
            setState("listening");
        }
    }, [processAudioQueue]);

    const startSession = useCallback(async () => {
        try {
            setState("listening");
            setError(null);
            setTranscript("");
            audioQueueRef.current = [];

            // 1. Get Token
            const response = await fetch("/api/voice/token");
            if (!response.ok) throw new Error("Failed to get Deepgram token");
            const { key } = await response.json();

            // 2. Setup Deepgram
            const deepgram = createClient(key);
            const connection = deepgram.listen.live({
                model: "nova-2",
                language: "en-US",
                smart_format: true,
                endpointing: 300,
            });
            deepgramRef.current = connection;

            // 3. Setup Events
            connection.on(LiveTranscriptionEvents.Open, () => {
                console.log("Deepgram connection open");

                connection.on(LiveTranscriptionEvents.Close, () => {
                    console.log("Deepgram connection closed");
                    setState("idle");
                });

                connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                    const trans = data.channel.alternatives[0].transcript;
                    if (trans && data.is_final) {
                        setTranscript((prev) => prev + " " + trans);
                        handleProcessing(trans);
                    }
                });

                connection.on(LiveTranscriptionEvents.Error, (err) => {
                    console.error("Deepgram error", err);
                    setError("Voice connection error");
                });
            });

            // 4. Get Microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && deepgramRef.current?.getReadyState() === 1) {
                    // If the AI is speaking, we might want to "barge in" here?
                    // For now, let's just keep sending audio so we can detect interruption later.
                    // However, to prevent echo, we might want to pause sending if state === "speaking"
                    // Use ref to check current state
                    if (stateRef.current !== "speaking" && stateRef.current !== "processing") {
                        deepgramRef.current?.send(event.data);
                    }
                }
            };

            mediaRecorder.start(100);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to start voice session");
            setState("idle");
        }
    }, [handleProcessing]);

    const stopSession = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            mediaRecorderRef.current = null;
        }

        if (deepgramRef.current) {
            deepgramRef.current.finish();
            deepgramRef.current = null;
        }

        // Close AudioContext if open
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setState("idle");
    }, []);

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);

    return {
        state,
        transcript,
        error,
        startSession,
        stopSession
    };
}
