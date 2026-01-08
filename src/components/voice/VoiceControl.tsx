"use client";

import { useVoiceSession } from "@/hooks/use-voice-session";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoiceControl() {
    const { state, transcript, error, startSession, stopSession, debugInfo } = useVoiceSession();

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
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
                        className="rounded-full w-16 h-16"
                        onClick={startSession}
                    >
                        <Mic className="h-6 w-6" />
                    </Button>
                ) : (
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
