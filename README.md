# X-Ray: Multi-Step Decision Debugger

A simple SDK and dashboard for debugging pipelines like LLM chains, multi-agent systems, etc.

## Quick Start

```bash
# Install everything
npm install

# Build the SDK first
cd packages/xray-sdk && npm run build && cd ../..

# Start the API server (port 3001)
npm run dev:api

# Start the dashboard (port 3000)
npm run dev:dashboard

# Run the demo pipeline (needs GEMINI_API_KEY in packages/demo/.env)
npm run demo
```

## Project Structure

```
packages/
├── xray-sdk/     # The SDK (single file!)
├── api/          # Simple Express API server
├── dashboard/    # React dashboard
└── demo/         # Example 5-step pipeline
```

## How to Use the SDK

```typescript
import * as xray from '@xray/sdk';

// Start a session
xray.startSession('My Pipeline', { userId: 123 });

// Create a step
const step = xray.startStep('process_data', 'transform');

// Set input
xray.setInput(step, { items: data });

// Add observations (things you looked at)
xray.addObservation(step, {
  id: 'item-1',
  type: 'candidate',
  label: 'Product A',
  data: { price: 29.99 },
  result: 'pass',
  reason: 'Meets all criteria'
});

// Add metrics (numbers you want to track)
xray.addMetric(step, 'items_processed', 42);

// Log events
xray.logInfo(step, 'Processing started');
xray.logWarning(step, 'Rate limit approaching');
xray.logDecision(step, 'Selected top candidate');

// Set output and end the step
xray.setOutput(step, { processed: result });
xray.endStep(step);

// End and export the session
xray.endSession();
await xray.exportSession();
```

## API Functions

### Session Functions
- `startSession(name, metadata)` - Start a new session
- `endSession(status)` - End the session ('completed' or 'failed')
- `getSession()` - Get the current session
- `exportSession()` - Send session to the API server
- `printSession()` - Print session to console
- `setApiEndpoint(url)` - Change where to send data

### Step Functions
- `startStep(name, type)` - Start a new step
- `endStep(step)` - End a step
- `setInput(step, input)` - Set step input
- `setOutput(step, output)` - Set step output
- `setReasoning(step, text)` - Explain why the step did what it did

### Observation Functions
- `addObservation(step, obs)` - Record something the step looked at

### Event Functions
- `logInfo(step, message, data)` - Log info
- `logWarning(step, message, data)` - Log warning
- `logError(step, message, data)` - Log error
- `logDecision(step, message, data)` - Log a decision

### Metric Functions
- `addMetric(step, name, value)` - Track a number

## Demo Pipeline

The demo runs a 5-step competitor selection pipeline:

1. **Keyword Generation** (LLM) - Ask Gemini for search keywords
2. **Candidate Search** (Mock) - Fetch potential competitors
3. **Apply Filters** - Filter by price, rating, reviews
4. **LLM Relevance** - Ask Gemini if they're real competitors
5. **Rank & Select** - Score and pick the best one

To run it:

```bash
# Set your Gemini API key
echo "GEMINI_API_KEY=your-key-here" > packages/demo/.env

# Run it
npm run demo
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sessions | Get all sessions |
| GET | /api/sessions/:id | Get one session |
| POST | /api/sessions | Save a session |
| DELETE | /api/sessions/:id | Delete one session |
| DELETE | /api/sessions | Delete all sessions |

## Known Limitations

- Data is stored in memory (lost on restart)
- Single user (no auth)
- Dashboard polls every 5 seconds
