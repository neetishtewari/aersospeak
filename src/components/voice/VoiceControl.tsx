"use client";

import { Scenario } from "@/data/scenarios";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { FeedbackCard } from "./FeedbackCard";

interface VoiceControlProps {
    scenario: Scenario;
}

export function VoiceControl({ scenario }: VoiceControlProps) {
    const { state, transcript, error, startSession, stopSession, completeTurn, debugInfo, lastFeedback } = useVoiceSession({ scenario });

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Header */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-sky-400">
                    Current Mode
                </span>
                <h2 className="text-xl font-bold text-white">{scenario.name}</h2>
            </div>

            {/* Feedback Card (Shows if available) */}
            {lastFeedback && state === "listening" && (
                <FeedbackCard feedback={lastFeedback} />
            )}

            {/* Transcript Area */}
            <div className="h-48 w-full rounded-xl border bg-card p-4 shadow overflow-y-auto">
                {transcript ? (
                    <p className="text-lg leading-relaxed">{transcript}</p>
                ) : (
                    <p className="text-muted-foreground italic text-center text-sm pt-8">
                        {state === "listening" ? "Listening..." : "Press start to speak"}
                    </p>
                )}
            </div>

            {error && (
                <p className="text-destructive text-sm font-medium">{error}</p>
            )}

            <div className="flex gap-4">
                {state === "idle" ? (
                    <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-sky-500 hover:bg-sky-400"
                        onClick={startSession}
                    >
                        <Mic className="h-6 w-6" />
                    </Button>
                ) : (
                    <>
                        {/* Show Done button only for manual endpointing scenarios when listening */}
                        {scenario.manualEndpointing && state === "listening" && (
                            <Button
                                size="lg"
                                className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-400"
                                onClick={completeTurn}
                            >
                                <Check className="h-8 w-8" />
                            </Button>
                        )}

                        <Button
                            size="lg"
                            variant="destructive"
                            className="rounded-full w-16 h-16"
                            onClick={stopSession}
                        >
                            {state === "processing" ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <Square className="h-6 w-6" />
                            )}
                        </Button>
                    </>
                )}
            </div>

            <div className="flex gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                <span className={cn("transition-colors", state === "listening" && "text-primary font-bold")}>
                    Listening
                </span>
                <span>•</span>
                <span className={cn("transition-colors", state === "processing" && "text-primary font-bold")}>
                    Processing
                </span>
                <span>•</span>
                <span className={cn("transition-colors", state === "speaking" && "text-primary font-bold")}>
                    Speaking
                </span>
            </div>

            {debugInfo.length > 0 && (
                <div className="w-full mt-4 p-3 bg-black/50 rounded-lg border border-white/10 text-[10px] font-mono text-zinc-400 h-32 overflow-y-auto">
                    {debugInfo.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
