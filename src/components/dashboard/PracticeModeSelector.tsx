"use client";

import { SCENARIOS, Scenario } from "@/data/scenarios";
import {
    Megaphone,
    Martini,
    Briefcase,
    Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PracticeModeSelectorProps {
    onSelect: (scenario: Scenario) => void;
}

const ICON_MAP: Record<string, any> = {
    Megaphone,
    Martini,
    Briefcase,
    Brain
};

export function PracticeModeSelector({ onSelect }: PracticeModeSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto p-4">
            {SCENARIOS.map((scenario) => {
                const Icon = ICON_MAP[scenario.icon] || Brain;

                return (
                    <div
                        key={scenario.id}
                        onClick={() => onSelect(scenario)}
                        className={cn(
                            "group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10",
                            "flex flex-col gap-4 text-left"
                        )}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 ring-1 ring-inset ring-sky-500/20 transition-all group-hover:bg-sky-500 group-hover:text-white">
                            <Icon className="h-6 w-6" />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                                {scenario.name}
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {scenario.description}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                            <span className={cn(
                                "text-xs font-medium px-2 py-1 rounded-full",
                                scenario.difficulty === 'Easy' && "bg-green-500/10 text-green-400",
                                scenario.difficulty === 'Medium' && "bg-yellow-500/10 text-yellow-400",
                                scenario.difficulty === 'Hard' && "bg-red-500/10 text-red-400",
                            )}>
                                {scenario.difficulty}
                            </span>
                            <span className="text-xs text-sky-400 opacity-0 transition-opacity group-hover:opacity-100 font-medium">
                                Start Session →
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
