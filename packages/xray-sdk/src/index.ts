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
