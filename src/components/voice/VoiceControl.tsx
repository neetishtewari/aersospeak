"use client";

import { Scenario } from "@/data/scenarios";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { FeedbackCard } from "./FeedbackCard";
import { VoiceOrb } from "./VoiceOrb";

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
                <h2 className="text-xl font-bold text-white tracking-tight">{scenario.name}</h2>
            </div>

            {/* Hint / Guide */}
            {scenario.guide && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 max-w-sm text-center">
                    <p className="text-xs text-sky-200/80 font-medium mb-1 uppercase tracking-wide">Suggested Response</p>
                    <p className="text-sm text-slate-300 italic">
                        {scenario.guide}
                    </p>
                </div>
            )}

            {/* Orb / Controls Area */}
            <div className="flex items-center justify-center min-h-[160px]">
                {/* 1. Manual Mode: Listening State (Special Layout) */}
                {scenario.manualEndpointing && state === "listening" ? (
                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                        <Button
                            size="lg"
                            className="rounded-full w-24 h-24 bg-green-500 hover:bg-green-400 shadow-[0_0_40px_-5px_rgba(74,222,128,0.4)] transition-all hover:scale-105"
                            onClick={completeTurn}
                        >
                            <Check className="h-10 w-10 text-white stroke-[3px]" />
                        </Button>
                        <button
                            onClick={stopSession}
                            className="text-white/40 text-xs font-medium hover:text-white transition-colors"
                        >
                            Cancel Session
                        </button>
                    </div>
                ) : (
                    /* 2. Standard Mode & Idle/Processing State (Voice Orb) */
                    <VoiceOrb
                        state={state}
                        onClick={state === "idle" ? startSession : stopSession}
                    />
                )}
            </div>

            {/* Feedback Card (Shows if available) */}
            {lastFeedback && state === "listening" && (
                <FeedbackCard feedback={lastFeedback} />
            )}

            {/* Transcript Area */}
            <div className="h-48 w-full rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 shadow-inner overflow-y-auto">
                {transcript ? (
                    <p className="text-lg leading-relaxed text-slate-100">{transcript}</p>
                ) : (
                    <p className="text-white/30 italic text-center text-sm pt-8">
                        {state === "listening" ? "Listening..." : "Tap the orb to start"}
                    </p>
                )}
            </div>

            {error && (
                <p className="text-red-400 text-sm font-medium">{error}</p>
            )}

            <div className="flex gap-2 text-[10px] text-white/30 uppercase tracking-widest font-medium">
                <span className={cn("transition-colors", state === "listening" && "text-sky-400")}>
                    Listening
                </span>
                <span>•</span>
                <span className={cn("transition-colors", state === "processing" && "text-sky-400")}>
                    Processing
                </span>
                <span>•</span>
                <span className={cn("transition-colors", state === "speaking" && "text-sky-400")}>
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
