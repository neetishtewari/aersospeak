"use client";

import { motion } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";

interface VoiceOrbProps {
    state: "idle" | "listening" | "processing" | "speaking";
    onClick?: () => void;
    className?: string;
}

export function VoiceOrb({ state, onClick, className }: VoiceOrbProps) {
    return (
        <div className="relative flex items-center justify-center w-32 h-32">
            {/* Ambient Glow */}
            <motion.div
                className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full"
                animate={{
                    scale: state === "listening" ? [1, 1.2, 1] : 1,
                    opacity: state === "idle" ? 0.3 : 0.6
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Core Orb */}
            <motion.button
                onClick={onClick}
                className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg shadow-sky-500/30 overflow-hidden group hover:scale-105 transition-transform"
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: state === "listening"
                        ? "0 0 40px -10px rgba(56, 189, 248, 0.5)"
                        : "0 0 20px -5px rgba(56, 189, 248, 0.3)"
                }}
            >
                {/* Internal Animation (Ripples) */}
                {state === "listening" && (
                    <>
                        <motion.div
                            className="absolute inset-0 border-2 border-white/30 rounded-full"
                            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute inset-0 border-2 border-white/30 rounded-full"
                            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                        />
                    </>
                )}

                {/* Icons */}
                <div className="relative z-20">
                    {state === "idle" && <Mic className="w-8 h-8" />}
                    {state === "listening" && <Square className="w-6 h-6 fill-white" />}
                    {state === "processing" && <Loader2 className="w-8 h-8 animate-spin" />}
                    {state === "speaking" && (
                        <div className="flex gap-1 items-end h-6">
                            {[0.5, 1, 0.5].map((s, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 bg-white rounded-full"
                                    animate={{ height: [8, 24, 8] }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        delay: i * 0.2
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.button>

            {/* Processing Orbit */}
            {state === "processing" && (
                <motion.div
                    className="absolute inset-0 rounded-full border-t-2 border-sky-400"
                    style={{ width: "100%", height: "100%" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            )}
        </div>
    );
}
