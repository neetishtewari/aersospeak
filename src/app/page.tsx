import Image from "next/image";

import { VoiceControl } from "@/components/voice/VoiceControl";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white">
            AeroSpeak
          </h1>
          <p className="max-w-[600px] text-lg text-slate-400 md:text-xl">
            Your AI-powered aviation English voice coach.
          </p>
        </div>

        <VoiceControl />
      </main>
    </div>
  );
}
