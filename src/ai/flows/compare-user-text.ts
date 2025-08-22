'use server';

/**
 * @fileOverview Compares user-typed text against original text, highlighting mistakes.
 *
 * - compareUserText - Function to compare user text and highlight mistakes.
 * - CompareUserTextInput - Input type for the compareUser-text function.
 * - CompareUserTextOutput - Output type for the compareUser-text function.
 */

import { ai } from '../client'; // or '../client' depending on folder
import {z} from 'genkit';

const CompareUserTextInputSchema = z.object({
  originalText: z
    .string()
    .describe('The original text that the user is trying to type.'),
  userText: z.string().describe('The text that the user has typed.'),
  durationSeconds: z.number().describe('The total time in seconds the user took to type.'),
});
export type CompareUserTextInput = z.infer<typeof CompareUserTextInputSchema>;

const MistakeSchema = z.object({
  start: z.number().describe('The starting index of the mistake in the original text.'),
  end: z.number().describe('The ending index of the mistake in the original text.'),
  type: z
    .string()
    .describe(
      'The type of mistake (e.g., spelling, grammar, omission, substitution, punctuation).'
    ),
  correction: z.string().optional().describe('The suggested correction for the mistake.')
});

const CompareUserTextOutputSchema = z.object({
  highlightedText: z
    .string()
    .describe(
      'The original text with highlighting using HTML <span> tags with classes "correct" (green background), "incorrect" (red background for spelling/substitution), and "omitted" (light gray background for omitted words).'
    ),
  mistakes: z.array(MistakeSchema).describe('An array of mistakes found in the user text.'),
  accuracy: z.number().describe('The accuracy percentage of the user text, comparing user text to the original.'),
  typingSpeed: z
    .number()
    .describe('The typing speed of the user in words per minute (WPM), calculated based on correctly typed words.'),
  timingConsistency: z.string().describe('An assessment of whether the user typed smoothly or with long pauses.'),
  overallRemarks: z.string().describe('An overall assessment of the user\'s performance, highlighting strengths and weaknesses.'),
  errorSummary: z.any().describe('A summary of the number of mistakes for each error type, as a JSON object e.g. {"spelling": 2, "grammar": 1}.'),
});
export type CompareUserTextOutput = z.infer<typeof CompareUserTextOutputSchema>;

export async function compareUserText(
  input: CompareUserTextInput
): Promise<CompareUserTextOutput> {
  return compareUserTextFlow(input);
}

const compareTextPrompt = ai.definePrompt({
  name: 'compareTextPrompt',
  input: {schema: CompareUserTextInputSchema},
  output: {schema: CompareUserTextOutputSchema},
  prompt: `You are a typing test evaluation expert. You will be provided with an original text and the text a user typed. Your task is to meticulously analyze the user's performance.

Original Text:
"{{{originalText}}}"

User-Typed Text:
"{{{userText}}}"

Total typing duration: {{{durationSeconds}}} seconds.

Your analysis must perform the following actions and return them in a valid JSON object:
1.  **Identify and Categorize Mistakes**: Find all discrepancies and categorize them. The categories are:
    *   **spelling**: Incorrectly spelled words.
    *   **grammar**: Grammatical errors (e.g., subject-verb agreement).
    *   **punctuation**: Missing, added, or incorrect punctuation.
    *   **omission**: Content from the original text that the user omitted. This is especially important if the user text is much shorter than the original text.
    *   **substitution**: Words used by the user that do not match the original.
2.  **List Mistakes**: Provide a detailed list of all mistakes found. For each mistake, specify the start and end index from the original text (if applicable), the type of error, and a suggested correction. Omissions must be listed as mistakes.
3.  **Summarize Errors**: Create a summary object counting the number of mistakes for each category (e.g., \`{"spelling": 3, "omission": 10}\`). If there are no errors, return an empty object \`{}\`.
4.  **Highlight Mistakes**: Create an HTML version of the *original text* where you wrap every mistake in a \`<span class="mistake">\` tag. Be precise. Omitted words can't be highlighted directly in the original text but must be reported in the mistakes list. Be careful to only highlight actual mistakes.
5.  **Calculate Accuracy**: Calculate the accuracy as a percentage. This should be based on how much of the user's text correctly matches the corresponding part of the original text. A common formula is (Correctly typed words / Total words in user text) * 100. If the user typed nothing, accuracy is 0. If the user text is very short compared to the original, the accuracy might be high for the text they typed, but the omissions must be noted in the remarks.
6.  **Calculate Typing Speed (WPM)**: Calculate the Words Per Minute (WPM). A word is typically defined as 5 characters, including spaces. The formula is: ((total characters in user typed text / 5) / durationSeconds) * 60. Base this on the text the user actually typed. If duration is 0 or user typed nothing, WPM should be 0.
  7.  **Analyze Timing/Consistency**: Assess the user's typing rhythm. Based on the duration and amount of text, comment on whether the typing was smooth, consistent, or had noticeable pauses. Example: "Mostly consistent, with a slight pause between paragraphs." Provide a JSON object with keys like "smoothness", "pauses", etc.
8.  **Provide Overall Remarks**: Give a concise overall assessment of the user's performance, mentioning both strengths (e.g., "Good accuracy on the typed portion") and areas for improvement (e.g., "A significant portion of the original text was omitted.").

Return a valid JSON object that strictly follows the output schema. It is critical that your entire response is a single JSON object and nothing else.
`,
});

const compareUserTextFlow = ai.defineFlow(
  {
    name: 'compareUserTextFlow',
    inputSchema: CompareUserTextInputSchema,
    outputSchema: CompareUserTextOutputSchema,
  },
  async input => {
    const {output} = await compareTextPrompt(input);
    if (output) {
      if (!output.errorSummary || typeof output.errorSummary !== 'object') {
        output.errorSummary = {};
      }
    }
    return output!;
  }
);
