import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

const BASE_URL = 'http://localhost:3000';

export function buildConversationChains(messages) {
  const messageMap = new Map(messages.map((msg) => [msg.id, msg]));
  const threadRoots = new Map();

  // Find root message for each message
  messages.forEach((msg) => {
    let currentMsg = msg;
    const thread = [];

    // Traverse up the reply chain to find root
    while (currentMsg) {
      thread.unshift(currentMsg);
      if (!currentMsg.replyToId) {
        // This is a root message
        threadRoots.set(currentMsg.id, thread);
        break;
      }
      currentMsg = messageMap.get(currentMsg.replyToId);
    }
  });

  // Convert threads to conversation strings
  return Array.from(threadRoots.values()).map((thread) =>
    thread.map((msg) => `${msg.sender}: ${msg.message}`).join(' ')
  );
}

export async function loadEmailsFromCsv(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return buildConversationChains(records);
  } catch (error) {
    console.error('Error loading CSV:', error);
    throw error;
  }
}

async function createDataset(conversations) {
  try {
    const response = await fetch(`${BASE_URL}/api/dataset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversations),
    });

    const dataset = await response.json();
    console.log('Dataset created:', dataset);
    
    return dataset;
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw error;
  }
}

async function analyzeEmails() {
  try {
    // 1. Load and process email data
    const conversations = await loadEmailsFromCsv('emails.csv');

    // 2. Create dataset
    const { id: datasetId } = await createDataset(conversations);

    // 3. Create labels for question analysis
    const questionLabels = [
      {
        label: 'UNANSWERED_QUESTION',
        description: 'Conversation ends with an unanswered question',
      },
      {
        label: 'ANSWERED_QUESTION',
        description: 'All questions in the conversation are answered',
      },
    ];

    const questionLabelsResponse = await fetch(`${BASE_URL}/api/dataset/${datasetId}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionLabels),
    });
    const questionLabelsResponseJson = await questionLabelsResponse.json();
    console.log('questionLabelsResponseJson:', questionLabelsResponseJson);
    const { id: questionLabelSetId } = questionLabelsResponseJson;

    // 4. Create labels for insurance topic analysis
    const topicLabels = [
      {
        label: 'DENTAL_INSURANCE',
        description: 'Conversation is about dental insurance',
      },
      {
        label: 'VISION_INSURANCE',
        description: 'Conversation is about vision insurance',
      },
      {
        label: 'MEDICAL_INSURANCE',
        description: 'Conversation is about medical insurance',
      },
      {
        label: 'OTHER',
        description: 'Conversation is about other topics',
      },
    ];

    const topicLabelsResponse = await fetch(`${BASE_URL}/api/dataset/${datasetId}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topicLabels),
    });
    const topicLabelsResponseJson = await topicLabelsResponse.json();
    console.log('topicLabelsResponseJson:', topicLabelsResponseJson);
    const { id: topicLabelSetId } = topicLabelsResponseJson;

    // 5. Get unanswered questions
    const unansweredResponse = await fetch(
      `${BASE_URL}/api/dataset/${datasetId}/labels/${questionLabelSetId}?label=UNANSWERED_QUESTION`
    );
    const unansweredData = await unansweredResponse.json();

    // 6. Get dental and vision related conversations
    const dentalResponse = await fetch(
      `${BASE_URL}/api/dataset/${datasetId}/labels/${topicLabelSetId}?label=DENTAL_INSURANCE`
    );
    const dentalData = await dentalResponse.json();

    const visionResponse = await fetch(
      `${BASE_URL}/api/dataset/${datasetId}/labels/${topicLabelSetId}?label=VISION_INSURANCE`
    );
    const visionData = await visionResponse.json();

    // 7. Create final filtered dataset
    const relevantConversations = [
      ...dentalData.filtered_conversations.conversations,
      ...visionData.filtered_conversations.conversations,
    ].filter((conv) => unansweredData.filtered_conversations.conversations.includes(conv));

    console.log('\n\n\nRelevant conversations:', relevantConversations);

    
    await createDataset(relevantConversations);
  } catch (error) {
    console.error('Error analyzing emails:', error);
  }
}

analyzeEmails();
