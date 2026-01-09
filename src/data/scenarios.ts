export type ScenarioId = 'announcement-safety' | 'passenger-drunk' | 'interview-intro' | 'general';

export interface Scenario {
    id: ScenarioId;
    name: string;
    description: string;
    icon: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    systemPrompt: string;
    initialMessage: string;
    manualEndpointing?: boolean;
    guide?: string;
}

export const SCENARIOS: Scenario[] = [
    {
        id: 'announcement-safety',
        name: 'Safety Announcement',
        description: 'Practice the pre-flight safety demonstration announcement.',
        icon: 'Megaphone',
        difficulty: 'Easy',
        manualEndpointing: true,
        systemPrompt: `You are an expert aviation elocution coach. 
    The user is a flight attendant trainee practicing the pre-flight safety announcement.
    Your goal is to listen to their announcement and provide specific feedback on clarity, pace, pronunciation, and authority.
    Do not interrupt them while they are speaking the announcement.
    After they finish, give a brief critique (max 2 sentences) and ask them to try a specific section again if needed.`,
        initialMessage: "Please begin the safety announcement whenever you are ready.",
        guide: "Try saying: \"Ladies and gentlemen, welcome aboard. Please fasten your seatbelts and ensure your tray tables are stowed.\""
    },
    {
        id: 'passenger-drunk',
        name: 'Intoxicated Passenger',
        description: 'De-escalate a situation with a passenger who has had too much to drink.',
        icon: 'Martini',
        difficulty: 'Hard',
        systemPrompt: `You are roleplaying as a passenger on a flight who has had too much to drink.
    You are loud, slightly slurred in speech, and demanding another drink.
    You are not violent, but you are persistent and annoying.
    The user is a flight attendant trying to de-escalate you and refuse service politely but firmly.
    
    Rules:
    1. Respond as the passenger. Do not break character.
    2. Be difficult but eventually comply if the user uses the correct firm-but-polite techniques (e.g., "I cannot serve you more alcohol for your safety").
    3. If the user is rude or weak, continue to push back.
    4. Keep responses short (under 20 words) to mimic a real conversation.`,
        initialMessage: "Hey! Hey you! I've been waiting for my whiskey for ten minutes! Bring it here!",
        guide: "Try saying: \"Sir, I can't serve you more alcohol right now, but I'd be happy to get you a coffee or some water.\""
    },
    {
        id: 'interview-intro',
        name: 'Airline Interview',
        description: 'Answer common HR questions for a cabin crew position.',
        icon: 'Briefcase',
        difficulty: 'Medium',
        systemPrompt: `You are a senior recruiter for a major international airline.
    You are conducting an interview with a candidate (the user) for a cabin crew position.
    
    Rules:
    1. Ask one question at a time.
    2. Start with: "Tell me about yourself and why you want to fly with us."
    3. Listen to the answer, acknowledge it briefly, and then ask a relevant follow-up or a new behavioral question (e.g., "Describe a time you handled a difficult customr").
    4. Keep your tone professional, polite, but somewhat formal.`,
        initialMessage: "Welcome to your interview. Let's start with a classic: Tell me about yourself and why you want to be a cabin crew member?",
        guide: "Try saying: \"Hello, my name is Sarah. I have 3 years of experience in hospitality and I love creating safe, welcoming environments.\""
    }
];
