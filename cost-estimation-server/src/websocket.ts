import express from 'express';
import { logger } from './logger.js';
import WebSocket, { WebSocketServer } from 'ws';

export const app = express();
export const ws = new WebSocketServer({ noServer: true });
const clients = new Map<string, WebSocket>();

app.use('/api', (req: express.Request, res: express.Response, next) => {
  logger.info(`HTTP ${req.method} ${req.url}`);
  next();
});

// 🔹 API Route: Start Process & Create WebSocket
app.get('/api/start-process', (req: express.Request, res: express.Response): void => {
  const clientId = req.query.clientId as string;
    if (!clientId) {
    res.status(400).json({ error: 'clientId is required' });
    return;
  }

  if (clients.has(clientId)) {
    logger.warn(`WebSocket already exists for client: ${clientId}`);
    res.status(200).json({ message: 'WebSocket already created' });
    return;
  }

  logger.info(`Starting WebSocket process for client: ${clientId}`);
  res.json({ message: 'WebSocket created' });
});

ws.on('connection', (ws, request) => {
  const clientId = new URL(request.url!, `http://${request.headers.host}`).searchParams.get('clientId');
  
  if (!clientId) {
    ws.close();
    return;
  }

  logger.info(`WebSocket connection established for client: ${clientId}`);
  ws.send(`Welcome, Client ${clientId}!`);
  clients.set(clientId, ws);

  ws.on('message', (message) => {
    logger.info(`Client ${clientId} says: ${message.toString()}`);
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    logger.warn(`Client ${clientId} disconnected`);
    clients.delete(clientId);
  });
});