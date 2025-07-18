// src/ai/flows/generate-whiteboard-diagram.ts
'use server';

/**
 * @fileOverview Generates diagrams based on a text prompt to visualize concepts on a collaborative whiteboard.
 *
 * - generateWhiteboardDiagram - A function that generates diagrams based on the given text prompt.
 * - GenerateWhiteboardDiagramInput - The input type for the generateWhiteboardDiagram function.
 * - GenerateWhiteboardDiagramOutput - The return type for the generateWhiteboardDiagram function, which contains the data URI of the generated image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateWhiteboardDiagramInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the diagram to generate.'),
});
export type GenerateWhiteboardDiagramInput = z.infer<typeof GenerateWhiteboardDiagramInputSchema>;

const GenerateWhiteboardDiagramOutputSchema = z.object({
  diagramDataUri: z
    .string()
    .describe(
      'The generated diagram as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type GenerateWhiteboardDiagramOutput = z.infer<typeof GenerateWhiteboardDiagramOutputSchema>;

export async function generateWhiteboardDiagram(
  input: GenerateWhiteboardDiagramInput
): Promise<GenerateWhiteboardDiagramOutput> {
  return generateWhiteboardDiagramFlow(input);
}

const generateDiagramPrompt = ai.definePrompt({
  name: 'generateDiagramPrompt',
  input: {schema: GenerateWhiteboardDiagramInputSchema},
  output: {schema: GenerateWhiteboardDiagramOutputSchema},
  prompt: `You are an AI assistant specialized in generating visual diagrams for educational purposes.
  Based on the user's request, generate a diagram that visually represents the concept described.
  Ensure the diagram is clear, concise, and easy to understand.
  
  User Request: {{{prompt}}}
  
  The diagram should be returned as a data URI.
`,
});

const generateWhiteboardDiagramFlow = ai.defineFlow(
  {
    name: 'generateWhiteboardDiagramFlow',
    inputSchema: GenerateWhiteboardDiagramInputSchema,
    outputSchema: GenerateWhiteboardDiagramOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    if (!media) {
      throw new Error('No diagram was generated.');
    }

    return {diagramDataUri: media.url!};
  }
);
