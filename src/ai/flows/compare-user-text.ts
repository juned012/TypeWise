'use server';

import { ai } from '../client';
import { z } from 'genkit';

const CompareUserTextInputSchema = z.object({
  originalText: z.string(),
  userText: z.string(),
  durationSeconds: z.number(),
});

const MistakeSchema = z.object({
  start: z.number(),
  end: z.number(),
  type: z.string(),
  correction: z.string().optional(),
});

const CompareUserTextOutputSchema = z.object({
  highlightedText: z.string(),
  mistakes: z.array(MistakeSchema),
  accuracy: z.number(),
  typingSpeed: z.number(),
  timingConsistency: z.string(),
  overallRemarks: z.string(),
  errorSummary: z.any(),
});

export type CompareUserTextInput = z.infer<typeof CompareUserTextInputSchema>;
export type CompareUserTextOutput = z.infer<typeof CompareUserTextOutputSchema>;

// ------------------ Helper functions ------------------

// Calculate WPM
function calculateWPM(userText: string, durationSeconds: number) {
  if (!userText || durationSeconds <= 0) return 0;
  const words = userText.length / 5;
  return (words / durationSeconds) * 60;
}

// Calculate accuracy based on original vs user text
function calculateAccuracy(originalText: string, userText: string) {
  if (!userText.trim()) return 0;

  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/\r?\n|\r/g, " ")   // remove newlines
      .replace(/[^\w\s]|_/g, "")  // remove punctuation
      .replace(/\s+/g, " ")       // normalize spaces
      .trim();

  const originalWords = clean(originalText).split(" ");
  const userWords = clean(userText).split(" ");

  let correct = 0;
  for (let i = 0; i < Math.min(originalWords.length, userWords.length); i++) {
    if (originalWords[i] === userWords[i]) correct++;
  }

  return Math.round((correct / originalWords.length) * 100);
}

// Simple timing consistency analysis
function analyzeTiming(durationSeconds: number, userText: string) {
  if (durationSeconds <= 10) return "Very fast and consistent typing.";
  if (durationSeconds > 10 && durationSeconds <= 30) return "Mostly consistent typing with slight pauses.";
  return "Typing was slow with noticeable pauses.";
}

// ------------------ AI prompt ------------------
// AI only handles mistakes and highlighted text
const compareTextPrompt = ai.definePrompt({
  name: 'compareTextPrompt',
  input: { schema: CompareUserTextInputSchema },
  output: { schema: CompareUserTextOutputSchema.omit({ accuracy: true, typingSpeed: true, timingConsistency: true }) },
  prompt: `
You are a typing test evaluation expert. Analyze the user's typed text against the original text for mistakes only.

Original Text:
"{{{originalText}}}"

User-Typed Text:
"{{{userText}}}"

Return a JSON object with:
1. Mistakes categorized (spelling, grammar, punctuation, omission, substitution).
2. Detailed mistakes (start, end, type, correction if applicable).
3. Highlighted original text using <span class="correct|incorrect|omitted">.

Do NOT calculate accuracy, WPM, or timing; these will be calculated in TypeScript. Return strictly one JSON object.
`,
});

// ------------------ Flow ------------------
const compareUserTextFlow = ai.defineFlow(
  {
    name: 'compareUserTextFlow',
    inputSchema: CompareUserTextInputSchema,
    outputSchema: CompareUserTextOutputSchema,
  },
  async (input) => {
    // Step 1: AI analyzes mistakes and highlights
    const { output } = await compareTextPrompt(input);

    // Step 2: Calculate metrics in TypeScript
   const accuracy = parseFloat(calculateAccuracy(input.originalText, input.userText).toFixed(1));
    const typingSpeed = parseFloat(calculateWPM(input.userText, input.durationSeconds).toFixed(1));
    const timingConsistency = analyzeTiming(input.durationSeconds, input.userText);

    // Step 3: Generate overall remarks
    const overallRemarks = `Typing accuracy: ${accuracy}%. Typing speed: ${Math.round(typingSpeed)} WPM. ${timingConsistency}`;

    return {
      ...output!,
      accuracy,
      typingSpeed,
      timingConsistency,
      overallRemarks,
      errorSummary: output?.errorSummary ?? {},
    };
  }
);

export const compareUserText = compareUserTextFlow;
