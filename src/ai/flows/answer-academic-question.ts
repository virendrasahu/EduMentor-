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
        prompt: `You are an expert tutor that answers academic questions. Your goal is to provide clear, structured, and easy-to-understand explanations.

Instructions for your response:
1.  **Structure the answer clearly:** Use headings, subheadings, and paragraphs to organize your thoughts.
2.  **Use point-wise format:** Whenever possible, present information in a point-wise manner using numbered lists or bullet points (using markdown).
3.  **Highlight key terms:** Use bold markdown for important vocabulary and concepts.
4.  **Provide step-by-step explanations:** For problems or complex topics, break down the solution into logical steps.

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
      console.error("Gemini failed, falling back to DeepSeek...", e);
      // If Gemini fails (e.g., overloaded), fallback to DeepSeek.
      if (e.message && (e.message.includes('Service Unavailable') || e.message.includes('overloaded'))) {
        try {
          console.log("Attempting fallback to DeepSeek...");
          const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: "You are a helpful AI tutor. Explain clearly with examples and provide structured, point-wise answers." },
                { role: "user", content: input.question },
              ],
            }),
          });

          if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`DeepSeek API error: ${res.status} ${res.statusText} - ${errorBody}`);
          }

          const data = await res.json();
          const answer = data?.choices?.[0]?.message?.content;
          
          if (!answer) {
            throw new Error("DeepSeek also failed to provide a valid response.");
          }

          // We won't generate visual aids for the fallback to keep it simple.
          return { answer };

        } catch (fallbackError: any) {
          console.error("DeepSeek fallback failed:", fallbackError);
          // If DeepSeek also fails, return a final error message.
          return {
            answer: "I'm sorry, both our primary and backup AI services are currently unavailable. Please try again later."
          };
        }
      }
      
      // For other errors, re-throw or return a generic error message.
      throw new Error("An unexpected error occurred while generating the answer.");
    }
  }
);
