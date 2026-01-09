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

import { motion } from "framer-motion";

export function PracticeModeSelector({ onSelect }: PracticeModeSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto p-4">
            {SCENARIOS.map((scenario, index) => {
                const Icon = ICON_MAP[scenario.icon] || Brain;

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={scenario.id}
                        onClick={() => onSelect(scenario)}
                        className={cn(
                            "group cursor-pointer relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300",
                            "hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1"
                        )}
                    >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        <div className="relative z-10 flex flex-col gap-4 text-left">
                            <div className="flex justify-between items-start">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white group-hover:ring-sky-500">
                                    <Icon className="h-7 w-7" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border",
                                    scenario.difficulty === 'Easy' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                    scenario.difficulty === 'Medium' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                    scenario.difficulty === 'Hard' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                )}>
                                    {scenario.difficulty}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                                    {scenario.name}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-light">
                                    {scenario.description}
                                </p>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-sky-400 opacity-0 transform translate-x-[-10px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                                <span>Start Simulation</span>
                                <span className="text-lg leading-none">→</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
