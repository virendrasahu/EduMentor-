
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

const shouldGenerateVisualAids = ai.defineTool(
  {
    name: 'shouldGenerateVisualAids',
    description: 'Determines whether visual aids (e.g., diagrams, code blocks) are needed to explain the answer to a question.',
    inputSchema: z.object({
      question: z.string().describe('The academic question.'),
      answer: z.string().describe('The generated answer'),
    }),
    outputSchema: z.boolean().describe('True if visual aids are needed, false otherwise.'),
  },
  async input => {
    const {question, answer} = input;
    const {text} = await ai.generate({
      prompt: `Based on the question: "${question}" and the answer: "${answer}", determine if visual aids such as a diagram, graph, chart, or code block are necessary to improve understanding. Answer with only 'true' or 'false'.`,
    });
    return text?.trim().toLowerCase() === 'true';
  }
);

const generateVisualAids = ai.defineTool(
  {
    name: 'generateVisualAids',
    description: 'Generates visual aids such as diagrams or formatted code to explain a concept.',
    inputSchema: z.object({
      question: z.string().describe('The academic question.'),
      answer: z.string().describe('The generated answer.'),
    }),
    outputSchema: z.string().describe('A data URI containing the visual aid (diagram, code block, etc.)'),
  },
  async input => {
    const {question, answer} = input;
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {text: `Question: ${question}`},
        {text: `Answer: ${answer}. Generate a visual aid to help explain this answer.`},
      ],
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


const answerAcademicQuestionFlow = ai.defineFlow(
  {
    name: 'answerAcademicQuestionFlow',
    inputSchema: AnswerAcademicQuestionInputSchema,
    outputSchema: AnswerAcademicQuestionOutputSchema,
  },
  async (input) => {
    try {
      // First, try to get the answer from Gemini.
      const { text: answer } = await ai.generate({
        prompt: `You are an expert tutor that answers academic questions.
Answer the following question:
${input.question}`,
        tools: [shouldGenerateVisualAids, generateVisualAids]
      });

      if (!answer) {
        throw new Error("Failed to generate an answer from Gemini.");
      }

      const needsVisualAid = await shouldGenerateVisualAids({ question: input.question, answer });

      let visualAids: string | undefined = undefined;
      if (needsVisualAid) {
        visualAids = await generateVisualAids({ question: input.question, answer });
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
