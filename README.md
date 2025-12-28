# X-Ray: Observability for AI Agents & Pipelines

A lightweight observability SDK and dashboard designed for debugging LLM chains, multi-agent systems, and complex decision pipelines. Built on **OpenTelemetry**.

## Quick Start

```bash
# Install dependencies
npm install

# Build the SDK
npm run build -w @xray/xray-sdk

# Start the observability backend (Port 3001)
npm run dev:api

# Start the dashboard (Port 3000)
npm run dev:dashboard

# Run a Demo
# 1. Pipeline Demo (requires COHERE_API_KEY in packages/demo/.env)
npm run demo

# 2. Multi-Agent Decision Demo
npm run demo:multiagent
```

## Project Structure

```
packages/
├── xray-sdk/     # OpenTelemetry-based instrumentation SDK
├── api/          # Express server for collecting/serving traces
├── dashboard/    # React-based UI for visualizing traces
└── demo/         # Example applications
    ├── src/index.ts     # Competitor Selection Pipeline
    └── src/decision.ts  # Multi-Agent Classifier System
```

## How to Use the SDK

X-Ray uses OpenTelemetry to automatically trace LLM calls.

```typescript
import * as xray from '@xray/sdk';
import { CohereClient } from 'cohere-ai';

// 1. Initialize Instrumentation (Call this first!)
xray.initInstrumentation('my-agent-service');

// 2. Instrument your LLM client
const cohere = xray.instrumentCohere(new CohereClient({
  token: process.env.COHERE_API_KEY,
}));

// 3. Make calls as usual - they will be automatically traced!
async function main() {
  const response = await cohere.chat({
    model: 'command-r7b-12-2024',
    message: 'Hello, world!',
  });
  
  // Traces will appear in the dashboard automatically.
  // X-Ray captures prompts, responses, model params, and execution time.
}
```

### Manual Instrumentation
You can also manually track custom steps:

```typescript
// Start a custom step
const step = xray.startStep('data_processing');

// Add details
xray.setInput(step, { rawData: '...' });
xray.logInfo(step, 'Processing started');

// Finish
xray.endStep(step);
```

## Demos

### 1. Competitor Selection Pipeline (`npm run demo`)
A 5-step linear pipeline that scouts for competitor products:
1.  **Keyword Generation** (LLM): Generates search terms.
2.  **Search** (Mock): Simulates an API search.
3.  **Filtering**: deterministic filtering (price, rating).
4.  **Relevance Check** (LLM): Evaluates if products are true competitors.
5.  **Selection**: Scores and picks the winner.

### 2. Multi-Agent Decision System (`npm run demo:multiagent`)
A router-based architecture that:
1.  **Classifies Intent**: Decides if a user wants to send a Slack DM or book a meeting.
2.  **Routes**: Dispatches to the specific "Agent" (SlackAgent vs CalendarAgent).
3.  **Extracts Entities**: The specialized agent extracts fields (e.g., recipient, time).
4.  **Summarizes**: Generates a confirmation message.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/:id` | Get details for a specific session |
| POST | `/api/observations` | Ingest a new trace observation |

## Known Limitations

-   Data is stored in-memory in the API server (resets on restart).
-   Dashboard polls periodically for updates.
-   Currently optimized for Cohere LLMs.
