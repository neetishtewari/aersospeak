# PRD: AI Voice Tutor for Cabin Crew & Airline Staff Training (MVP)

## 1. Product Overview

### Product Name (Working)
AeroSpeak (placeholder – can be changed)

### Problem Statement
Cabin crew and airline staff aspirants face consistent challenges:
- Limited opportunities to practice spoken English confidently
- Inconsistent and subjective feedback from trainers
- Lack of realistic airline-style interview and in-flight scenarios
- No structured speaking practice outside classroom hours

Human-led training does not scale well and varies in quality.

### Solution
Build a **voice-first AI tutor** that enables trainees to:
- Practice aviation-specific speaking scenarios using voice
- Receive instant, structured, and objective feedback
- Improve fluency, confidence, pronunciation, and professionalism
- Train anytime without trainer dependency

This product is a **virtual speaking coach**, not a chatbot.

---

## 2. Goals & Success Metrics

### Primary Goals
- Deliver realistic voice-based speaking practice
- Provide actionable feedback immediately after speaking
- Increase trainee confidence and speaking readiness
- Create a differentiated, scalable training product

### MVP Success Metrics
- 70%+ practice session completion rate
- Average 3+ sessions per user per week
- 80%+ users report improved speaking confidence
- Voice response + feedback latency under 3 seconds

---

## 3. Target Users

### Primary Users
- Cabin crew aspirants
- Airline ground staff trainees
- Students enrolled in aviation training institutes

### Secondary Users
- Trainers (optional review)
- Training administrators

---

## 4. Core Use Cases (MVP)

### UC1: Voice-Based Speaking Practice
Users interact entirely via voice.

Examples:
- “Practice a boarding announcement”
- “Take my cabin crew interview”
- “Simulate a difficult passenger conversation”

---

### UC2: Scenario-Based Training
The AI plays different roles:
- Airline interviewer
- Passenger
- Senior cabin crew member

Scenarios include:
- Boarding and safety announcements
- Passenger complaint handling
- Emergency communication
- HR and behavioral interview questions

---

### UC3: Instant Feedback & Scoring
After every spoken response, the system evaluates:
- Pronunciation
- Fluency
- Grammar
- Tone and politeness
- Professional airline language

The user receives:
- Short spoken feedback
- Text feedback summary
- Simple numeric score

---

## 5. MVP Feature Set (Must-Have)

### 5.1 Voice Interaction
- Real-time voice input
- Real-time voice output
- Natural conversational turn-taking
- User can interrupt or pause the agent

---

### 5.2 Practice Modes

#### Mode 1: Announcement Practice
- User delivers a flight or safety announcement
- AI evaluates clarity, pace, and pronunciation

#### Mode 2: Passenger Interaction
- AI simulates passenger behavior (neutral, confused, upset)
- User responds verbally

#### Mode 3: Interview Practice
- AI asks airline-style interview questions
- Follow-up questions based on user responses

---

### 5.3 Feedback Engine
Each user response generates structured feedback:

- Pronunciation quality
- Fluency and pacing
- Grammar corrections (only if necessary)
- Tone and professionalism

Example feedback:
“Your pronunciation was clear. Try slowing down slightly and emphasize safety-related words.”

---

### 5.4 Scoring System
Simple and motivating, not evaluative.

- Score range: 0–100
- Confidence indicator: Low / Medium / High
- Top 2 improvement suggestions

---

## 6. Explicitly Out of Scope (MVP)

- Full Learning Management System (LMS)
- Video-based training
- Deep accent phoneme-level coaching
- Certifications or official grading
- Airline hiring system integration

---

## 7. User Experience Flow

1. User opens web or mobile app
2. Clicks “Start Voice Practice”
3. Selects practice mode
4. AI introduces scenario using voice
5. User speaks
6. AI responds and guides next step
7. Session ends with feedback and score

---

## 8. Suggested System Architecture

Client (Web / Mobile)
→ Voice SDK
→ LLM (Conversation + Evaluation)
→ Scoring Logic
→ Feedback Generator
← Voice Response

---

## 9. AI & Voice Behavior Guidelines

### Voice Personality
- Calm
- Supportive
- Professional airline trainer tone
- Never judgmental or harsh

### Conversation Rules
- One question at a time
- Clear instructions before speaking
- Encouragement when user struggles
- Option to retry answers

---

## 10. Prompting Strategy (High Level)

### System Prompt Concept
“You are a professional airline training instructor helping candidates improve spoken English, confidence, and communication using realistic aviation scenarios.”

### Evaluation Prompt Concept
Analyze the user’s speech on pronunciation, fluency, grammar, and tone. Return concise, constructive feedback.

---

## 11. Data Storage (MVP)

Store only essential data:
- User ID
- Practice mode
- Speaking score
- Feedback text
- Session duration
- Timestamp

Raw audio storage is not required in MVP.

---

## 12. Privacy & Ethical Considerations

- Clearly inform users that AI evaluates speech
- Do not store voice recordings by default
- Scores are advisory, not hiring decisions
- Maintain supportive, non-discriminatory feedback

---

## 13. Phase 2 (Post-MVP)

- Trainer dashboard
- Progress tracking across sessions
- Accent-specific coaching
- Airline-specific modules
- Placement readiness score

---

## 14. MVP Launch Plan

- Pilot with 10–20 trainees
- Collect qualitative feedback
- Improve scenarios and feedback quality
- Expand rollout to full cohorts

---

## 15. Core Differentiator

“Unlimited, private, airline-style voice practice with instant professional feedback.”

---

## 16. Open Questions (For Later)

- Audio storage policy (opt-in)
- Pricing model (included vs add-on)
- Trainer visibility into sessions
- Support for languages beyond English
