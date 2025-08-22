import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-audio';
import '@/ai/flows/compare-user-text.ts';
import '@/ai/flows/performance-metrics.ts';