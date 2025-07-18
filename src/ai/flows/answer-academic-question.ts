
// AnswerAcademicQuestion.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering academic questions with a fallback mechanism.
 *
 * - answerAcademicQuestion - A function that handles the process of answering academic questions.
 * - AnswerAcademicQuestionInput - The input type for the answerAcademicQuestion function.
 * - AnswerAcademicQuestionOutput - The return type for the answerAcademicQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerAcademicQuestionInputSchema = z.object({
  question: z.string().describe('The academic question to be answered.'),
});
export type AnswerAcademicQuestionInput = z.infer<typeof AnswerAcademicQuestionInputSchema>;

const AnswerAcademicQuestionOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the question.'),
  visualAids: z
    .string()
    .optional()
    .describe('Visual aids such as diagrams or formatted code (as a data URI).'),
});
export type AnswerAcademicQuestionOutput = z.infer<typeof AnswerAcademicQuestionOutputSchema>;

export async function answerAcademicQuestion(input: AnswerAcademicQuestionInput): Promise<AnswerAcademicQuestionOutput> {
  return answerAcademicQuestionFlow(input);
}

const generateVisualAids = ai.defineTool(
  {
    name: 'generateVisualAids',
    description: 'Generates a visual aid like an image, diagram, or chart to help explain a concept if one is needed.',
    inputSchema: z.object({
      question: z.string().describe('The academic question.'),
    }),
    outputSchema: z.string().describe('A data URI containing the visual aid (diagram, chart, etc.)'),
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Question: ${input.question}. Generate a visual aid like an image, diagram, or chart to help explain the answer to this question. Important: Any text in the visual aid must be in English.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      return 'No visual aid generated.';
    }

    return media.url;
  }
);

const expertTutorPrompt = ai.definePrompt(
  {
    name: 'expertTutorPrompt',
    input: {schema: AnswerAcademicQuestionInputSchema},
    tools: [generateVisualAids],
    prompt: `You are an expert tutor. Provide a perfect, structured answer to the following academic question.
Your answer should be of medium length - detailed enough to be informative, but not excessively long.
Use formatting like markdown, lists, and bold text to make the answer clear.
If you think a visual aid (like a diagram, chart, or image) would be helpful to explain your answer, use the generateVisualAids tool.
Question:
{{{question}}}`,
  }
);


const answerAcademicQuestionFlow = ai.defineFlow(
  {
    name: 'answerAcademicQuestionFlow',
    inputSchema: AnswerAcademicQuestionInputSchema,
    outputSchema: AnswerAcademicQuestionOutputSchema,
  },
  async (input) => {
    try {
      const llmResponse = await ai.generate({
        prompt: expertTutorPrompt.prompt,
        input: input,
        model: 'googleai/gemini-2.0-flash',
        tools: [generateVisualAids]
      });

      const answer = llmResponse.text;
      if (!answer) {
        throw new Error("Failed to generate an answer from Gemini.");
      }

      const toolRequest = llmResponse.toolRequests[0];
      let visualAids: string | undefined = undefined;

      if (toolRequest && toolRequest.tool.name === 'generateVisualAids') {
        const toolResponse = await toolRequest.run();
        visualAids = toolResponse;
      }
      
      return { answer, visualAids };

    } catch (e: any) {
       console.error("AI service failed:", e);
       let errorMessage = "An unexpected error occurred while generating the answer.";
       if (e.message && (e.message.includes('Service Unavailable') || e.message.includes('overloaded'))) {
           errorMessage = "I'm sorry, the AI service is currently overloaded. Please try again in a few moments.";
       }
       return {
         answer: errorMessage,
       };
    }
  }
);
