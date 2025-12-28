// X-Ray SDK - Simple version
// For debugging multi-step pipelines like LLM chains

import { randomUUID } from 'crypto';

// ==================== TYPES ====================

// What a step looks like
export interface Step {
  stepId: string;
  sessionId: string;
  name: string;
  type: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  input: any;
  output: any;
  reasoning: string | null;
  observations: Observation[];
  events: Event[];
  metrics: Record<string, number>;
}

// What an observation looks like (things the step looked at)
export interface Observation {
  id: string;
  type: string;
  label: string;
  data: any;
  result: string | null;  // 'pass', 'fail', 'selected', etc
  reason: string | null;
  score: number | null;
  children: Observation[] | null;
}

// What an event looks like (things that happened)
export interface Event {
  timestamp: string;
  type: string;  // 'info', 'warning', 'error', 'decision'
  message: string;
  data: any;
}

// What a session looks like
export interface Session {
  sessionId: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  metadata: any;
  steps: Step[];
}

// Summary of a session (for listing)
export interface SessionSummary {
  sessionId: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  stepCount: number;
  durationMs: number | null;
}

// ==================== GLOBAL STATE ====================

// The current session we're tracking
let currentSession: Session | null = null;

// Where to send the data when done
let apiEndpoint: string = 'http://localhost:3001/api/sessions';

// ==================== SESSION FUNCTIONS ====================

// Start a new session
export function startSession(name: string, metadata: any = {}): Session {
  const session: Session = {
    sessionId: randomUUID(),
    name: name,
    startedAt: new Date().toISOString(),
    endedAt: null,
    status: 'running',
    metadata: metadata,
    steps: []
  };
  
  currentSession = session;
  console.log(`[X-Ray] Started session: ${name}`);
  
  return session;
}

// End the current session
export function endSession(status: 'completed' | 'failed' = 'completed'): void {
  if (!currentSession) {
    console.log('[X-Ray] No session to end');
    return;
  }
  
  currentSession.endedAt = new Date().toISOString();
  currentSession.status = status;
  
  console.log(`[X-Ray] Ended session: ${currentSession.name} (${status})`);
}

// Get the current session
export function getSession(): Session | null {
  return currentSession;
}

// Send the session to the API
export async function exportSession(): Promise<void> {
  if (!currentSession) {
    console.log('[X-Ray] No session to export');
    return;
  }
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentSession)
    });
    
    if (response.ok) {
      console.log(`[X-Ray] Session exported to ${apiEndpoint}`);
    } else {
      console.log(`[X-Ray] Failed to export: ${response.status}`);
    }
  } catch (error) {
    console.log(`[X-Ray] Export error: ${error}`);
  }
}

// Print session to console (for debugging)
export function printSession(): void {
  if (!currentSession) {
    console.log('[X-Ray] No session to print');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Session: ${currentSession.name}`);
  console.log(`ID: ${currentSession.sessionId}`);
  console.log(`Status: ${currentSession.status}`);
  console.log(`Steps: ${currentSession.steps.length}`);
  console.log('='.repeat(60));
  
  for (const step of currentSession.steps) {
    console.log(`\n  Step: ${step.name} (${step.type})`);
    console.log(`  Duration: ${step.durationMs}ms`);
    if (step.reasoning) {
      console.log(`  Reasoning: ${step.reasoning}`);
    }
    console.log(`  Observations: ${step.observations.length}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Set where to send the data
export function setApiEndpoint(url: string): void {
  apiEndpoint = url;
}

// ==================== STEP FUNCTIONS ====================

// Start a new step
export function startStep(name: string, type: string = 'custom'): Step {
  if (!currentSession) {
    throw new Error('No session! Call startSession first.');
  }
  
  const step: Step = {
    stepId: randomUUID(),
    sessionId: currentSession.sessionId,
    name: name,
    type: type,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMs: null,
    input: {},
    output: {},
    reasoning: null,
    observations: [],
    events: [],
    metrics: {}
  };
  
  currentSession.steps.push(step);
  
  return step;
}

// End a step
export function endStep(step: Step): void {
  step.endedAt = new Date().toISOString();
  
  // Calculate how long it took
  const start = new Date(step.startedAt).getTime();
  const end = new Date(step.endedAt).getTime();
  step.durationMs = end - start;
}

// Set the input for a step
export function setInput(step: Step, input: any): void {
  step.input = input;
}

// Set the output for a step
export function setOutput(step: Step, output: any): void {
  step.output = output;
}

// Set reasoning (why the step did what it did)
export function setReasoning(step: Step, reasoning: string): void {
  step.reasoning = reasoning;
}

// ==================== OBSERVATION FUNCTIONS ====================

// Add an observation (something the step looked at)
export function addObservation(step: Step, obs: {
  id: string;
  type: string;
  label: string;
  data?: any;
  result?: string;
  reason?: string;
  score?: number;
  children?: Observation[];
}): void {
  const observation: Observation = {
    id: obs.id,
    type: obs.type,
    label: obs.label,
    data: obs.data || {},
    result: obs.result || null,
    reason: obs.reason || null,
    score: obs.score || null,
    children: obs.children || null
  };
  
  step.observations.push(observation);
}

// ==================== EVENT FUNCTIONS ====================

// Add an event to a step
export function addEvent(step: Step, type: string, message: string, data: any = null): void {
  const event: Event = {
    timestamp: new Date().toISOString(),
    type: type,
    message: message,
    data: data
  };
  
  step.events.push(event);
}

// Shortcut for info event
export function logInfo(step: Step, message: string, data: any = null): void {
  addEvent(step, 'info', message, data);
}

// Shortcut for warning event
export function logWarning(step: Step, message: string, data: any = null): void {
  addEvent(step, 'warning', message, data);
}

// Shortcut for error event
export function logError(step: Step, message: string, data: any = null): void {
  addEvent(step, 'error', message, data);
}

// Shortcut for decision event
export function logDecision(step: Step, message: string, data: any = null): void {
  addEvent(step, 'decision', message, data);
}

// ==================== METRIC FUNCTIONS ====================

// Add a metric (a number we want to track)
export function addMetric(step: Step, name: string, value: number): void {
  step.metrics[name] = value;
}

// ==================== OTEL INTEGRATION ====================

import * as otel from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Export instrumentation helpers
export * from './instrumentation/cohere.js';

// Parsed decision structure
interface ParsedDecision {
  agent: string | null;
  confidence: number | null;
  reasoning: string | null;
  recipient: string | null;
  message: string | null;
  title: string | null;
  attendees: string[] | null;
  datetime: string | null;
  urgency: string | null;
  yesNo: boolean | null;
  rawFields: Record<string, string>;
}

// Parse LLM response text for decision patterns
// Parse LLM response text for decision patterns
function parseDecisionFromResponse(response: string | undefined): ParsedDecision {
  const result: ParsedDecision = {
    agent: null,
    confidence: null,
    reasoning: null,
    recipient: null,
    message: null,
    title: null,
    attendees: null,
    datetime: null,
    urgency: null,
    yesNo: null,
    rawFields: {}
  };
  
  if (!response) return result;
  
  // Common keys to look for
  const keys: { key: keyof ParsedDecision; pattern: string; transform?: (val: string) => any }[] = [
    { key: 'agent', pattern: 'AGENT' },
    { key: 'confidence', pattern: 'CONFIDENCE', transform: (v) => parseFloat(v) },
    { key: 'reasoning', pattern: '(?:REASON|REASONING)' },
    { key: 'recipient', pattern: 'RECIPIENT' },
    { key: 'message', pattern: 'MESSAGE' },
    { key: 'title', pattern: 'TITLE' },
    { key: 'datetime', pattern: 'DATETIME' },
    { key: 'urgency', pattern: 'URGENCY' },
    { key: 'attendees', pattern: 'ATTENDEES' },
  ];
  
  // Robust parsing: capture content after KEY: until next KEY: or end of string
  // Regex explanation:
  // KEY:\s*         -> Match Key and colon and whitespace
  // ([\s\S]+?)      -> Capture everything (including newlines) non-greedily
  // (?=\n[A-Z_]+:|$) -> Until we see a newline followed by UPPERCASE_KEY: OR end of string
  
  for (const { key, pattern, transform } of keys) {
    const regex = new RegExp(`${pattern}:\\s*([\\s\\S]+?)(?=\\n[A-Z_]+:|$)`, 'i');
    const match = response.match(regex);
    
    if (match) {
      const rawValue = match[1].trim();
      
      if (key === 'attendees') {
        const list = rawValue.split(',').map(a => a.trim());
        result.attendees = list;
        result.rawFields['attendees'] = rawValue;
      } else {
        const value = transform ? transform(rawValue) : rawValue;
        (result as any)[key] = value;
        result.rawFields[key] = rawValue;
      }
    }
  }
  
  // Check for YES/NO responses (fallback if not structured)
  if (!result.rawFields['decision']) {
    const lines = response.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].toUpperCase();
      if (firstLine.includes('YES')) {
        result.yesNo = true;
        result.rawFields['decision'] = 'YES';
        // Try to get reason from second line if reasoning wasn't parsed
        if (lines.length > 1 && !result.reasoning) {
          result.reasoning = lines.slice(1).join(' ').trim();
        }
      } else if (firstLine.includes('NO')) {
        result.yesNo = false;
        result.rawFields['decision'] = 'NO';
        if (lines.length > 1 && !result.reasoning) {
          result.reasoning = lines.slice(1).join(' ').trim();
        }
      }
    }
  }
  
  return result;
}

class XRaySpanProcessor implements SpanProcessor {
// ... existing methods ...
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  onStart(span: otel.Span): void {
  }

  onEnd(span: ReadableSpan): void {
    if (!currentSession) return;
    const step = startStep(span.name, 'auto_instrumented');
    step.startedAt = new Date(span.startTime[0] * 1000 + span.startTime[1] / 1e6).toISOString();
    step.endedAt = new Date(span.endTime[0] * 1000 + span.endTime[1] / 1e6).toISOString();
    step.durationMs = span.duration[0] * 1000 + span.duration[1] / 1e6;
    const attributes = span.attributes;
    
    // Extract LLM-specific information for decision visibility
    const prompt = attributes['gen_ai.request.message'] as string | undefined;
    const response = attributes['gen_ai.response.text'] as string | undefined;
    const model = attributes['gen_ai.request.model'] as string | undefined;
    
    // Structure the input with the prompt
    setInput(step, {
      prompt: prompt || null,
      model: model || null,
      rawAttributes: attributes
    });
    
    // Parse the response for decision patterns
    const parsedDecision = parseDecisionFromResponse(response);
    
    // Structure the output with parsed decision
    setOutput(step, {
      response: response || null,
      parsedDecision: parsedDecision,
    });
    
    // Set reasoning if we found decision patterns
    if (parsedDecision.reasoning) {
      setReasoning(step, parsedDecision.reasoning);
    } else if (parsedDecision.agent || parsedDecision.confidence) {
      // Construct reasoning from parsed fields
      const parts = [];
      if (parsedDecision.agent) parts.push(`Selected agent: ${parsedDecision.agent}`);
      if (parsedDecision.confidence) parts.push(`Confidence: ${(parsedDecision.confidence * 100).toFixed(0)}%`);
      if (parts.length > 0) {
        setReasoning(step, parts.join(' | '));
      }
    }
    
    // Add observation with full span details
    addObservation(step, {
      id: `span_${span.spanContext().spanId}`,
      type: 'llm_decision',
      label: 'LLM Decision',
      data: {
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
        parentId: (span as any).parentSpanId,
        prompt: prompt,
        response: response,
        parsedDecision: parsedDecision,
        status: span.status
      }
    });

    if (model) {
      addEvent(step, 'info', `Model used: ${model}`);
    }
    
    if (parsedDecision.agent) {
      addEvent(step, 'decision', `Agent selected: ${parsedDecision.agent}`, {
        confidence: parsedDecision.confidence,
        reason: parsedDecision.reasoning
      });
    }
    
    endStep(step);
    
    // Auto-export the observation to the API
    this.exportObservation(step);
  }
  
  // Send observation to API asynchronously
  private exportObservation(step: Step): void {
    const observationEndpoint = apiEndpoint.replace('/sessions', '/observations');
    
    fetch(observationEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: step.sessionId,
        sessionName: currentSession?.name || 'Unknown Session',
        step: step
      })
    })
    .then(response => {
      if (response.ok) {
        console.log(`[X-Ray] Observation exported: ${step.name}`);
      } else {
        console.log(`[X-Ray] Failed to export observation: ${response.status}`);
      }
    })
    .catch(error => {
      console.log(`[X-Ray] Observation export error: ${error}`);
    });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

let otelSdk: NodeSDK | null = null;

export function initInstrumentation(serviceName: string) {
  // Use env var to set service name if Resource class is tricky to import
  process.env.OTEL_SERVICE_NAME = serviceName;

  // Auto-create a session for this service
  startSession(serviceName, { autoCreated: true });

  otelSdk = new NodeSDK({
    spanProcessor: new XRaySpanProcessor(),
  });

  otelSdk.start();
  console.log('[X-Ray] OpenTelemetry instrumentation initialized');
}
