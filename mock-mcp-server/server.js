

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware
app.use(cors()); 
app.use(express.json()); // To parse JSON bodies

// Explicitly handle preflight requests
app.options('*', cors()); // Enable pre-flight for all routes

// In-memory store for connected clients
let clients = [];

// Function to send SSE data
const sendSse = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// SSE Endpoint
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);
  console.log(`Client ${clientId} connected to SSE endpoint from origin: ${req.headers.origin}`);

  // Send a welcome message
  sendSse(res, { type: 'message', content: 'Welcome to the Mock MCP SSE Server!' });

  req.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    clients = clients.filter(client => client.id !== clientId);
    res.end();
  });
});

// Message Endpoint
app.post('/message', (req, res) => {
  const { message } = req.body;
  console.log('Received message:', message);

  // Create the message payload
  const payload = {
    type: 'message',
    content: `Echo from server: ${message}`,
  };

  // Broadcast the message to all connected SSE clients
  clients.forEach(client => {
    sendSse(client.res, payload);
  });

  res.status(200).json({ status: 'Message received' });
});

app.listen(port, () => {
  console.log(`Mock MCP SSE server started on http://localhost:${port}`);
});
