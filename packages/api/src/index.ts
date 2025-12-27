// X-Ray API Server
// Simple REST API to store and get session data

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Store sessions in memory (simple object)
const sessions: Record<string, any> = {};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all sessions (just the summaries)
app.get('/api/sessions', (req, res) => {
  const list = [];
  
  for (const id in sessions) {
    const s = sessions[id];
    
    // Calculate duration
    let duration = null;
    if (s.endedAt) {
      duration = new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
    }
    
    list.push({
      sessionId: s.sessionId,
      name: s.name,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      status: s.status,
      stepCount: s.steps ? s.steps.length : 0,
      durationMs: duration
    });
  }
  
  // Sort by newest first
  list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  
  res.json(list);
});

// Get one session
app.get('/api/sessions/:id', (req, res) => {
  const session = sessions[req.params.id];
  
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  
  res.json(session);
});

// Save a session
app.post('/api/sessions', (req, res) => {
  const session = req.body;
  
  if (!session.sessionId || !session.name) {
    res.status(400).json({ error: 'Missing sessionId or name' });
    return;
  }
  
  sessions[session.sessionId] = session;
  
  console.log(`Saved session: ${session.name}`);
  res.status(201).json({ message: 'Saved', sessionId: session.sessionId });
});

// Delete one session
app.delete('/api/sessions/:id', (req, res) => {
  if (!sessions[req.params.id]) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  
  delete sessions[req.params.id];
  res.json({ message: 'Deleted' });
});

// Delete all sessions
app.delete('/api/sessions', (req, res) => {
  for (const id in sessions) {
    delete sessions[id];
  }
  res.json({ message: 'All deleted' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`X-Ray API running on http://localhost:${PORT}`);
});
