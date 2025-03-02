import express from 'express';
import { logger } from './logger.js';
import WebSocket, { WebSocketServer } from 'ws';
import { AggregationService } from './aggregation-service.js';
import util from 'util';

export const app = express();
export const ws = new WebSocketServer({ noServer: true });
const clients = new Map<string, WebSocket>();
const lastMessageMap = new Map<string, string>();
const aggregationService = new AggregationService();

function isDuplicated(clientId: string, message: string): boolean {
	if (lastMessageMap.get(clientId) === message) {
		return true; // It's a duplicate message
	}

	lastMessageMap.set(clientId, message);
	return false;
}

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

	ws.on('message', async (message) => {
		const messageStr = message.toString();

		if (isDuplicated(clientId, messageStr)) return;

		try {
			const data = JSON.parse(messageStr);

			if (data.type === 'CPU_USAGE') {

				await aggregationService.processAggregation(data.payload);
				ws.send(`Received CPU Usage: ${data.payload.usageRate}`);

			} else if (data.type === 'PREPARE_TO_CLOSE') {

				ws.send('Sending aggregated data to client...');
				const avgCPU = await aggregationService.getAggregatedDataOfEachTab();

				logger.info(util.format('Aggregated CPU Usage: %o', avgCPU));

				ws.send(JSON.stringify([...avgCPU]));

				ws.send('Closing WebSocket connection...');
				ws.close();
				clientId && clients.delete(clientId);
				aggregationService.clearData();
			}
		} catch (error: any) {
			logger.warn(`Client ${clientId} sent plain text: "${messageStr}"`);
			ws.send(`Received Text: "${messageStr}"`);
		}
	});
});