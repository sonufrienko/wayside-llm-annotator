import { Label } from './types';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function analyzeLabeledContent(
  conversations: string[],
  labels: Label[]
): Promise<Array<{ label: string; reason: string }>> {
  const results = await Promise.all(
    conversations.map(async (conversation) => {
      const prompt = createAnalysisPrompt(conversation, labels);

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a conversation analyzer. You should analyze the conversation and select the most appropriate label from the provided options. Provide your reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      console.log(completion.choices[0].message.content);
      const result = JSON.parse(completion.choices[0].message.content);
      console.log(result);
      return {
        label: result.label,
        reason: result.reason
      };
    })
  );

  return results;
}

function createAnalysisPrompt(conversation: string, labels: Label[]): string {
  return `
Analyze this conversation:
${conversation}

Select one of these labels:
${labels.map(l => `${l.label}: ${l.description}`).join('\n')}

Respond with a JSON object containing:
1. "label": The selected label
2. "reason": Your reasoning for selecting this label

Example response format:
{
  "label": "LABEL_NAME",
  "reason": "Detailed explanation of why this label was chosen"
}`;
}
