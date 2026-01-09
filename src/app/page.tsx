"use client";

import { useState } from "react";
import { VoiceControl } from "@/components/voice/VoiceControl";
import { PracticeModeSelector } from "@/components/dashboard/PracticeModeSelector";
import { Scenario } from "@/data/scenarios";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-neutral-950 to-black text-white">
      <main className="flex flex-col items-center gap-8 text-center px-4 w-full">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white">
            AeroSpeak
          </h1>
          <p className="max-w-[600px] text-lg text-slate-400 md:text-xl mx-auto">
            {selectedScenario ? selectedScenario.name : "Your AI-powered aviation English voice coach."}
          </p>
        </div>

        {selectedScenario ? (
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setSelectedScenario(null)}
              className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <VoiceControl
              scenario={selectedScenario}
            />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <PracticeModeSelector onSelect={setSelectedScenario} />
          </div>
        )}
      </main>
    </div>
  );
}

