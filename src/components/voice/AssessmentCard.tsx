import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { Assessment } from "@/hooks/use-voice-session";

interface AssessmentCardProps {
    assessment: Assessment;
    onRestart: () => void;
}

export function AssessmentCard({ assessment, onRestart }: AssessmentCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-400";
        if (score >= 75) return "text-yellow-400";
        return "text-orange-400";
    };

    const getQualificationColor = (level: string) => {
        switch (level) {
            case "Very High": return "bg-green-500/20 text-green-400 border-green-500/50";
            case "High": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
            case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
            default: return "bg-red-500/20 text-red-400 border-red-500/50";
        }
    };

    return (
        <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header / Score */}
            <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-6 flex flex-col items-center border-b border-white/5 relative">
                <div className="relative mb-2">
                    <Trophy className={`h-12 w-12 ${getScoreColor(assessment.score)}`} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Assessment Complete</h2>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-4xl font-bold ${getScoreColor(assessment.score)}`}>
                        {assessment.score}
                    </span>
                    <span className="text-white/40 text-sm">/ 100</span>
                </div>

                {/* Qualification Badge */}
                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide ${getQualificationColor(assessment.qualification_likeliness)}`}>
                    Hiring Probability: {assessment.qualification_likeliness}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">

                {/* Summary */}
                <div>
                    <h3 className="text-sm uppercase tracking-widest text-white/40 font-bold mb-2">Summary</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {assessment.summary}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Strengths */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Strengths</span>
                        </div>
                        <ul className="space-y-1">
                            {assessment.strengths.map((point, i) => (
                                <li key={i} className="text-xs text-slate-400 pl-6 relative">
                                    <span className="absolute left-1.5 top-1.5 w-1 h-1 rounded-full bg-green-500/50" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Improvements */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                            <AlertCircle className="h-4 w-4" />
                            <span>Areas for Improvement</span>
                        </div>
                        <ul className="space-y-1">
                            {assessment.improvements.map((point, i) => (
                                <li key={i} className="text-xs text-slate-400 pl-6 relative">
                                    <span className="absolute left-1.5 top-1.5 w-1 h-1 rounded-full bg-amber-500/50" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        onClick={onRestart}
                        className="w-full bg-white text-black hover:bg-zinc-200 font-medium"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Start New Session
                    </Button>
                </div>
            </div>
        </div>
    );
}
