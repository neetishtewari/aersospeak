"use client";

import { Feedback } from "@/hooks/use-voice-session";
import { CheckCircle2, AlertCircle, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackCardProps {
    feedback: Feedback | null;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
    if (!feedback) return null;

    return (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">

                {/* Score Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-sky-400" />
                        <h3 className="font-semibold text-white">Performance</h3>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                        feedback.score >= 80 ? "bg-green-500/20 text-green-400 ring-green-500/30" :
                            feedback.score >= 60 ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30" : "bg-red-500/20 text-red-400 ring-red-500/30"
                    )}>
                        <span>{feedback.score}/100</span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="space-y-4">
                    {/* Pronunciation */}
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            {feedback.pronunciation === 'Good' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Pronunciation</p>
                            <p className="text-xs text-slate-300">{feedback.pronunciation}</p>
                        </div>
                    </div>

                    {/* Grammar Check */}
                    {feedback.grammar_correction && (
                        <div className="flex items-start gap-3 bg-red-950/30 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-red-300 uppercase mb-1">Grammar Fix</p>
                                <p className="text-sm text-slate-200 italic">"{feedback.grammar_correction}"</p>
                            </div>
                        </div>
                    )}

                    {/* Tip */}
                    <div className="flex items-start gap-3 bg-sky-950/30 p-3 rounded-lg border border-sky-500/20">
                        <Sparkles className="h-4 w-4 text-sky-400 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-sky-300 uppercase mb-1">Coach Tip</p>
                            <p className="text-sm text-white">{feedback.suggestion}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
