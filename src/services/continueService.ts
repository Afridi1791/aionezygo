import { ProjectState, AiResponse } from '../types';
import { getAiChangesStream, StreamingCallbacks } from './geminiService';

// Continue streaming context
export interface ContinueContext {
    userInstruction: string;
    image?: { data: string, mimeType: string };
    rawTextSoFar: string;
    explanationSoFar: string;
    jsonStarted: boolean;
    assistantMessageId: string;
    mode: 'chat' | 'scaffold';
}

// Continue streaming from where it left off
export async function continueAiStream(
    projectState: ProjectState,
    context: ContinueContext,
    callbacks: StreamingCallbacks
): Promise<void> {
    // Create a modified instruction that includes the context
    const continueInstruction = context.jsonStarted 
        ? `[CONTINUE] You were generating a response and stopped mid-way. Here's what you generated so far:

${context.rawTextSoFar}

Continue from exactly where you left off. If you were in the middle of a JSON block, complete it with valid JSON. Do not repeat any previous content.

Original request: ${context.userInstruction}`
        : `[CONTINUE] You were generating a response and stopped mid-way. Here's what you generated so far:

${context.rawTextSoFar}

Continue your explanation naturally from where you left off, then provide the JSON response in \`\`\`json code blocks. Do not repeat any previous content.

Original request: ${context.userInstruction}`;

    // Use the existing streaming function with the continue instruction
    await getAiChangesStream(projectState, continueInstruction, callbacks, context.image);
}
