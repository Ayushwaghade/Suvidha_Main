'use server';

/**
 * @fileOverview Implements an automated trust verification flow for provider profiles and reviews.
 *
 * - analyzeProviderData - Analyzes provider profiles and reviews to identify potential fraud or inconsistencies.
 * - AnalyzeProviderDataInput - The input type for the analyzeProviderData function.
 * - AnalyzeProviderDataOutput - The return type for the analyzeProviderData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeProviderDataInputSchema = z.object({
  profileData: z.string().describe('The complete profile data of the service provider, including bio, skills, experience, and rates.'),
  reviews: z.array(z.string()).describe('An array of review texts for the service provider.'),
});
export type AnalyzeProviderDataInput = z.infer<typeof AnalyzeProviderDataInputSchema>;

const AnalyzeProviderDataOutputSchema = z.object({
  flagged: z.boolean().describe('Whether the provider profile or reviews are flagged for potential fraud or inconsistencies.'),
  flaggingReason: z.string().describe('The reason for flagging the profile or reviews, detailing the identified inconsistencies or fraudulent patterns. Empty if not flagged.'),
});
export type AnalyzeProviderDataOutput = z.infer<typeof AnalyzeProviderDataOutputSchema>;

export async function analyzeProviderData(input: AnalyzeProviderDataInput): Promise<AnalyzeProviderDataOutput> {
  return analyzeProviderDataFlow(input);
}

const analyzeProviderDataPrompt = ai.definePrompt({
  name: 'analyzeProviderDataPrompt',
  input: {schema: AnalyzeProviderDataInputSchema},
  output: {schema: AnalyzeProviderDataOutputSchema},
  prompt: `You are an AI assistant tasked with identifying potentially fraudulent or inconsistent information in service provider profiles and reviews. Analyze the provided profile data and reviews, and determine if there are any indicators of fraudulent activity, such as fake reviews, inconsistencies between the profile and reviews, or other suspicious patterns.

Profile Data: {{{profileData}}}

Reviews:
{{#each reviews}}
- {{{this}}}
{{/each}}

Based on your analysis, set the 'flagged' field to true if you detect any suspicious activity or inconsistencies. If 'flagged' is true, provide a detailed explanation in the 'flaggingReason' field, describing the identified issues. If no issues are found, set 'flagged' to false and leave 'flaggingReason' empty.

Output in JSON format:
`,
});

const analyzeProviderDataFlow = ai.defineFlow(
  {
    name: 'analyzeProviderDataFlow',
    inputSchema: AnalyzeProviderDataInputSchema,
    outputSchema: AnalyzeProviderDataOutputSchema,
  },
  async input => {
    const {output} = await analyzeProviderDataPrompt(input);
    return output!;
  }
);
