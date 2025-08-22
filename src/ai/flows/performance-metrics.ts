'use server';
/**
 * @fileOverview Calculates and displays typing speed and accuracy.
 *
 * - calculatePerformanceMetrics - A function that calculates performance metrics based on original and user-typed text.
 * - PerformanceMetricsInput - The input type for the calculatePerformanceMetrics function.
 * - PerformanceMetricsOutput - The return type for the calculatePerformanceMetrics function.
 */

import { ai } from '../client'; // or '../client' depending on folder

import {z} from 'genkit';

const PerformanceMetricsInputSchema = z.object({
  originalText: z.string().describe('The original transcribed text.'),
  userText: z.string().describe('The text entered by the user.'),
});
export type PerformanceMetricsInput = z.infer<typeof PerformanceMetricsInputSchema>;

const PerformanceMetricsOutputSchema = z.object({
  typingSpeedWPM: z.number().describe('The user\u2019s typing speed in words per minute.'),
  accuracy: z.number().describe('The accuracy of the user\u2019s typing as a percentage.'),
  mistakes: z.array(z.string()).describe('A list of mistakes made by the user.'),
});
export type PerformanceMetricsOutput = z.infer<typeof PerformanceMetricsOutputSchema>;

export async function calculatePerformanceMetrics(input: PerformanceMetricsInput): Promise<PerformanceMetricsOutput> {
  return calculatePerformanceMetricsFlow(input);
}

const calculatePerformanceMetricsPrompt = ai.definePrompt({
  name: 'calculatePerformanceMetricsPrompt',
  input: {schema: PerformanceMetricsInputSchema},
  output: {schema: PerformanceMetricsOutputSchema},
  prompt: `You are an expert in analyzing text and calculating typing performance metrics.

  Calculate the typing speed (words per minute) and accuracy (percentage) of the user\u2019s text compared to the original text.
  Also, identify and list the mistakes made by the user.

  Original Text: {{{originalText}}}
  User Text: {{{userText}}}

  Ensure the output is accurate and provides helpful insights into the user\u2019s typing performance.`,
});

const calculatePerformanceMetricsFlow = ai.defineFlow(
  {
    name: 'calculatePerformanceMetricsFlow',
    inputSchema: PerformanceMetricsInputSchema,
    outputSchema: PerformanceMetricsOutputSchema,
  },
  async input => {
    const {output} = await calculatePerformanceMetricsPrompt(input);
    return output!;
  }
);
