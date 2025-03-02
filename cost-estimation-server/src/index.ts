import { createServer } from 'http'
import { logger } from './logger.js'
import { app, ws as WebSocketServer } from './websocket.js'

const port = 3000
const server = createServer(app);


server.on('upgrade', (request, socket, head) => {
    logger.info('WebSocket upgrade request received');
    WebSocketServer.handleUpgrade(request, socket, head, (ws) => {
    WebSocketServer.emit('connection', ws, request);
  });
});


server.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});