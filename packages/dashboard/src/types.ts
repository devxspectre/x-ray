// Types for the dashboard
// These match what the API returns

// A session summary (shown in the list)
export interface SessionSummary {
  sessionId: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  stepCount: number;
  durationMs: number | null;
}

// A full session (shown in detail view)
export interface Session {
  sessionId: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  metadata: any;
  steps: Step[];
}

// A step in the session
export interface Step {
  stepId: string;
  name: string;
  type: string;
  durationMs: number | null;
  reasoning: string | null;
  input: any;
  output: any;
  observations: Observation[];
  events: Event[];
  metrics: Record<string, number>;
}

// An observation (something the step looked at)
export interface Observation {
  id: string;
  type: string;
  label: string;
  data: any;
  result: string | null;
  reason: string | null;
  score: number | null;
  children: Observation[] | null;
}

// An event (something that happened)
export interface Event {
  timestamp: string;
  type: string;
  message: string;
  data: any;
}
