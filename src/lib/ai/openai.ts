import {
  aiAnalysisSchema,
  mindfulnessExerciseSchema,
  motivationSchema,
  patternInsightsSchema,
  type AIAnalysis,
  type MindfulnessExercise,
  type MotivationContent,
  type PatternInsights,
} from "@/schemas";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenAI(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  };

  if (options?.jsonMode !== false) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return content;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned) as T;
}

const SAFETY_SYSTEM_PROMPT = `You are MindMate AI, an empathetic wellness companion for students preparing for high-stakes exams (JEE, NEET, UPSC, CAT, GATE, CUET, Board Exams).

CRITICAL SAFETY RULES:
- You are NOT a therapist, doctor, or mental health professional.
- NEVER diagnose mental illness or medical conditions.
- NEVER claim certainty about the user's mental state.
- Use supportive, conversational, empathetic language — never robotic.
- Always include appropriate safety messaging when distress is detected.
- Encourage professional help when appropriate.
- Respond ONLY with valid JSON matching the requested schema.`;

export interface CheckInContext {
  journalEntry: string;
  moodScore: number;
  energyLevel: number;
  sleepHours: number;
  studyHours: number;
  examType: string;
  daysRemaining: number;
  confidenceLevel: number;
  anxietyLevel: number;
  dayOfWeek: string;
}

export interface HistoricalEntry {
  date: string;
  moodScore: number;
  energyLevel: number;
  sleepHours: number;
  studyHours: number;
  confidenceLevel: number;
  anxietyLevel: number;
  examType: string;
  daysRemaining: number;
  journalSummary?: string;
  stressLevel?: string;
  burnoutRisk?: string;
}

export async function analyzeCheckIn(
  current: CheckInContext,
  history: HistoricalEntry[]
): Promise<AIAnalysis> {
  const historyContext =
    history.length > 0
      ? `\n\nHistorical entries (most recent first):\n${JSON.stringify(history.slice(0, 14), null, 2)}`
      : "\n\nNo previous entries — this is the user's first check-in.";

  const prompt = `Analyze this student's daily emotional check-in and return JSON matching this exact schema:
{
  "emotionalState": "string describing current emotional state",
  "stressLevel": "low|moderate|high|severe",
  "burnoutRisk": "low|moderate|high|critical",
  "motivationLevel": "low|moderate|high",
  "confidenceIndicators": "string",
  "negativeSelfTalkPatterns": ["array of detected patterns"],
  "hiddenStressTriggers": ["array"],
  "recurringThemes": ["array — identify patterns across history if available"],
  "productivityImpact": "string",
  "academicPressureIndicators": ["array"],
  "personalizedInsights": ["2-4 specific, empathetic insights referencing their data"],
  "copingStrategies": ["3-5 actionable strategies tailored to their state"],
  "encouragement": "warm, conversational encouragement paragraph",
  "wellnessScore": 0-100,
  "wellnessScoreExplanation": "string explaining the score",
  "improvementSuggestions": ["2-4 suggestions"],
  "stressPredictorScore": 0-100,
  "stressPredictorExplanation": "predict stress risk based on days remaining, study load, sleep, mood history",
  "earlyWarning": { "triggered": boolean, "severity": "none|mild|moderate|severe", "message": "supportive alert if needed" },
  "safetyNote": "always include gentle reminder that this is not therapy and to seek help if needed"
}

Current check-in:
- Journal: ${current.journalEntry}
- Mood: ${current.moodScore}/10
- Energy: ${current.energyLevel}/10
- Sleep: ${current.sleepHours} hours
- Study: ${current.studyHours} hours
- Exam: ${current.examType}, ${current.daysRemaining} days remaining
- Confidence: ${current.confidenceLevel}/10
- Anxiety: ${current.anxietyLevel}/10
- Day: ${current.dayOfWeek}
${historyContext}

Identify cross-entry patterns when history exists (e.g., "stress spikes Sunday evenings", "low confidence after peer comparison", "sleep <6h correlates with anxiety").`;

  const raw = await callOpenAI([
    { role: "system", content: SAFETY_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);

  const parsed = parseJSON<unknown>(raw);
  return aiAnalysisSchema.parse(parsed);
}

export async function generateMindfulnessExercise(
  current: CheckInContext,
  analysis: Pick<AIAnalysis, "stressLevel" | "burnoutRisk">
): Promise<MindfulnessExercise> {
  const prompt = `Generate a personalized mindfulness exercise as JSON:
{
  "title": "string",
  "type": "reset|breathing|grounding|visualization|exam_anxiety|sleep_prep",
  "durationMinutes": number (1-15, based on time available and urgency),
  "instructions": ["step-by-step instructions"],
  "adaptationReason": "why this exercise fits their current state"
}

Adapt to:
- Mood: ${current.moodScore}/10, Anxiety: ${current.anxietyLevel}/10
- Stress: ${analysis.stressLevel}, Burnout risk: ${analysis.burnoutRisk}
- Exam: ${current.examType}, ${current.daysRemaining} days remaining
- Energy: ${current.energyLevel}/10, Sleep: ${current.sleepHours}h

Choose exercise type and duration based on their immediate needs.`;

  const raw = await callOpenAI([
    { role: "system", content: SAFETY_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ], { temperature: 0.8 });

  return mindfulnessExerciseSchema.parse(parseJSON(raw));
}

export async function generateMotivation(
  current: CheckInContext,
  history: HistoricalEntry[],
  streakDays: number
): Promise<MotivationContent> {
  const prompt = `Generate personalized motivation content as JSON:
{
  "affirmation": "personalized affirmation for their exam journey",
  "dailyEncouragement": "warm daily encouragement paragraph",
  "progressCelebration": "celebrate specific progress if data supports it, else null",
  "milestoneRecognition": "recognize milestones if applicable, else null"
}

Context:
- Exam: ${current.examType}, ${current.daysRemaining} days left
- Study streak: ${streakDays} productive days this week
- Mood: ${current.moodScore}/10, Confidence: ${current.confidenceLevel}/10
- Recent history: ${JSON.stringify(history.slice(0, 7))}

Be specific and genuine — reference their actual consistency and effort.`;

  const raw = await callOpenAI([
    { role: "system", content: SAFETY_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ], { temperature: 0.85 });

  return motivationSchema.parse(parseJSON(raw));
}

export async function generatePatternInsights(
  history: HistoricalEntry[]
): Promise<PatternInsights> {
  const prompt = `Analyze emotional patterns across these journal entries and return JSON:
{
  "weeklySummary": "empathetic weekly emotional summary",
  "monthlyReport": "monthly wellness report if enough data, else brief summary",
  "moodTrend": "improving|stable|declining",
  "burnoutTrend": "improving|stable|declining",
  "anxietyTrend": "improving|stable|declining",
  "confidenceTrend": "improving|stable|declining",
  "sleepTrend": "improving|stable|declining",
  "studyConsistencyTrend": "improving|stable|declining",
  "correlations": [{ "relationship": "e.g. Sleep vs Mood", "insight": "string", "strength": "weak|moderate|strong" }],
  "riskAlerts": [{ "type": "string", "message": "string", "severity": "info|warning|critical" }],
  "discoveredPatterns": ["specific patterns like 'stress spikes every Sunday evening'"]
}

Entries (${history.length} total):
${JSON.stringify(history, null, 2)}

Discover study-wellness correlations (sleep vs mood, study hours vs stress, confidence trends).`;

  const raw = await callOpenAI([
    { role: "system", content: SAFETY_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);

  return patternInsightsSchema.parse(parseJSON(raw));
}

export async function chatWithCoach(
  message: string,
  context: {
    profile?: { examType?: string; examGoal?: string; stressTriggers?: string[] };
    recentHistory: HistoricalEntry[];
    chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  }
): Promise<string> {
  const systemContent = `${SAFETY_SYSTEM_PROMPT}

You are chatting with a student as their wellness coach. Remember their exam goals, past challenges, and stress triggers.
Respond conversationally in plain text (NOT JSON). Keep responses concise but warm.

Student profile: ${JSON.stringify(context.profile ?? {})}
Recent wellness data: ${JSON.stringify(context.recentHistory.slice(0, 5))}`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...context.chatHistory.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  return callOpenAI(messages, { temperature: 0.8, maxTokens: 1024, jsonMode: false });
}
