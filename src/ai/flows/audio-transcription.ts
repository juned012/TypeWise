'use server';

import { ai } from '../client'; // <-- import from client.ts
import { z } from 'genkit';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'An audio file as a data URI (Base64), e.g., data:<mimetype>;base64,<encoded_data>'
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The English transcription of the audio file.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeAudioPrompt',
  input: { schema: TranscribeAudioInputSchema },
  output: { schema: TranscribeAudioOutputSchema },
  prompt: `
You are a transcription AI. 

- Transcribe ONLY the English spoken content from the audio.
- Do NOT include Hindi, transliterations, or extra commentary.
- Return strictly in JSON format:
{
  "transcription": "<English spoken text>"
}

Audio: {{media url=audioDataUri}}
  `,
});

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
