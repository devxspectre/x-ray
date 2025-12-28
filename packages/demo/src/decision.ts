import "dotenv/config";
import { CohereClient } from "cohere-ai";
import * as xray from "@xray/sdk";

// Setup Cohere
// Need to initialize XRay instrumentation first
xray.initInstrumentation('decision-agent-demo');

const cohere = xray.instrumentCohere(new CohereClient({
  token: process.env.COHERE_API_KEY ?? ''
}));

// Agent definitions
const agents = [
  {
    id: 'slack_dm',
    name: 'Slack DM Agent',
    focus: 'Send direct messages to users via Slack',
    keywords: ['message', 'dm', 'slack', 'tell', 'notify', 'send', 'ping', 'reach out', 'contact']
  },
  {
    id: 'calendar',
    name: 'Calendar Manager',
    focus: 'Create and manage calendar events and meetings',
    keywords: ['meeting', 'calendar', 'schedule', 'invite', 'event', 'appointment', 'book', 'set up']
  }
];

// Types
interface ClassificationResult {
  agentId: string;
  confidence: number;
}

interface AgentResult {
  success: boolean;
  action: string;
  details: any;
}

// Sample user prompts to test
const testPrompts = [
  "Send a message to John about the project update",
  "Schedule a meeting with the design team for next Tuesday at 2pm",
  "DM Sarah and let her know the deployment is complete",
  "Set up a recurring weekly standup with the engineering team",
  "Ping Mike about the code review",
];

// Main function
async function main() {
  const userPrompt = testPrompts[Math.floor(Math.random() * testPrompts.length)];
  
  console.log('\n🤖 Multi-Agent Decision System\n');
  console.log(`User Request: "${userPrompt}"\n`);
  
  try {
    // Classify the user intent
    const classification = await classifyIntent(userPrompt);
    
    // Route to appropriate agent
    const result = await routeToAgent(classification, userPrompt);
    
    // Summarize the action
    await summarizeAction(userPrompt, classification, result);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Task completed successfully');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Decision flow failed:', error);
  }
}

// Classify the user's intent
async function classifyIntent(prompt: string): Promise<ClassificationResult> {
  let classification: ClassificationResult;
  
  try {
    const classificationPrompt = `You are an intent classifier. Given a user request, determine which agent should handle it.

Available agents:
1. slack_dm - Handles: sending messages, DMs, notifications, pinging users
2. calendar - Handles: scheduling meetings, creating events, booking appointments

User request: "${prompt}"

RESPOND WITH EXACTLY this format:
AGENT: [slack_dm or calendar]
CONFIDENCE: [0.0-1.0]`;

    const result = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: classificationPrompt,
    });
    
    const text = result.text || '';
    
    // Parse the response
    const agentMatch = text.match(/AGENT:\s*(slack_dm|calendar)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/i);
    
    const agentId = agentMatch ? agentMatch[1].toLowerCase() : 'slack_dm';
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;
    
    classification = { agentId, confidence };
    
  } catch (error) {
    console.error('⚠️ LLM classification failed, using keyword fallback');
    
    // Fallback to keyword matching
    const promptLower = prompt.toLowerCase();
    
    let slackScore = 0;
    let calendarScore = 0;
    
    const slackAgent = agents.find(a => a.id === 'slack_dm')!;
    const calendarAgent = agents.find(a => a.id === 'calendar')!;
    
    slackScore = slackAgent.keywords.filter(k => promptLower.includes(k)).length;
    calendarScore = calendarAgent.keywords.filter(k => promptLower.includes(k)).length;
    
    const agentId = calendarScore > slackScore ? 'calendar' : 'slack_dm';
    const confidence = 0.6;
    
    classification = { agentId, confidence };
  }
  
  console.log(`   → Selected: ${classification.agentId} (${(classification.confidence * 100).toFixed(0)}% confident)`);
  
  return classification;
}

// Route to the appropriate agent
async function routeToAgent(classification: ClassificationResult, prompt: string): Promise<AgentResult> {
  if (classification.agentId === 'slack_dm') {
    return await runSlackAgent(prompt);
  } else {
    return await runCalendarAgent(prompt);
  }
}

// Slack DM Agent
async function runSlackAgent(prompt: string): Promise<AgentResult> {
  let result: AgentResult;
  
  try {
    const agentPrompt = `You are a Slack DM assistant. Extract the following from this request:

Request: "${prompt}"

Respond with EXACTLY this format:
RECIPIENT: [name of person to message]
MESSAGE: [the message content to send]
URGENCY: [low, medium, or high]`;

    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: agentPrompt,
    });
    
    const text = response.text || '';
    
    const recipientMatch = text.match(/RECIPIENT:\s*(.+?)(?:\n|$)/i);
    const messageMatch = text.match(/MESSAGE:\s*(.+?)(?:\n|$)/i);
    const urgencyMatch = text.match(/URGENCY:\s*(low|medium|high)/i);
    
    const recipient = recipientMatch ? recipientMatch[1].trim() : 'Unknown';
    const message = messageMatch ? messageMatch[1].trim() : prompt;
    const urgency = urgencyMatch ? urgencyMatch[1].toLowerCase() : 'medium';
    
    result = {
      success: true,
      action: 'send_slack_dm',
      details: { recipient, message, urgency }
    };
    
  } catch (error) {
    console.error('⚠️ Slack agent LLM failed');
    
    result = {
      success: true,
      action: 'send_slack_dm',
      details: {
        recipient: 'Extracted User',
        message: prompt,
        urgency: 'medium'
      }
    };
  }
  
  console.log(`   → Recipient: ${result.details.recipient}`);
  console.log(`   → Message: "${result.details.message}"`);
  console.log(`   → Urgency: ${result.details.urgency}`);
  
  return result;
}

// Calendar Agent
async function runCalendarAgent(prompt: string): Promise<AgentResult> {
  let result: AgentResult;
  
  try {
    const agentPrompt = `You are a calendar assistant. Extract the following from this request:

Request: "${prompt}"

Respond with EXACTLY this format:
TITLE: [meeting/event title]
ATTENDEES: [comma separated names]
DATETIME: [proposed date and time]
DURATION: [duration in minutes]`;

    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: agentPrompt,
    });
    
    const text = response.text || '';
    
    const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const attendeesMatch = text.match(/ATTENDEES:\s*(.+?)(?:\n|$)/i);
    const datetimeMatch = text.match(/DATETIME:\s*(.+?)(?:\n|$)/i);
    const durationMatch = text.match(/DURATION:\s*(\d+)/i);
    
    const title = titleMatch ? titleMatch[1].trim() : 'Meeting';
    const attendees = attendeesMatch ? attendeesMatch[1].trim().split(',').map(a => a.trim()) : ['Team'];
    const datetime = datetimeMatch ? datetimeMatch[1].trim() : 'TBD';
    const duration = durationMatch ? parseInt(durationMatch[1]) : 30;
    
    result = {
      success: true,
      action: 'create_calendar_event',
      details: { title, attendees, datetime, duration }
    };
    
  } catch (error) {
    console.error('⚠️ Calendar agent LLM failed');
    
    result = {
      success: true,
      action: 'create_calendar_event',
      details: {
        title: 'New Meeting',
        attendees: ['Team'],
        datetime: 'TBD',
        duration: 30
      }
    };
  }
  
  console.log(`   → Title: ${result.details.title}`);
  console.log(`   → Attendees: ${result.details.attendees.join(', ')}`);
  console.log(`   → Date/Time: ${result.details.datetime}`);
  console.log(`   → Duration: ${result.details.duration} minutes`);
  
  return result;
}

// Summarize the action taken
async function summarizeAction(
  prompt: string,
  classification: ClassificationResult,
  result: AgentResult
): Promise<void> {
  let summary: string;
  
  try {
    const summaryPrompt = `Summarize this action in one sentence:

User requested: "${prompt}"
Agent used: ${classification.agentId}
Action taken: ${result.action}
Details: ${JSON.stringify(result.details)}

Provide a brief, friendly confirmation message.`;

    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: summaryPrompt,
    });
    
    summary = response.text || 'Action completed successfully.';
    
  } catch (error) {
    
    if (classification.agentId === 'slack_dm') {
      summary = `✉️ Slack DM prepared for ${result.details.recipient}`;
    } else {
      summary = `📅 Calendar event "${result.details.title}" ready to create`;
    }
  }
  
  console.log(`\n   Summary: ${summary}`);
}

// Run the demo
main();