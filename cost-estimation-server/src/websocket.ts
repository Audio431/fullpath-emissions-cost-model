import express from 'express';
import { logger } from './logger.js';
import WebSocket, { WebSocketServer } from 'ws';
import { AggregationService } from './aggregation-service.js';
import util from 'util';
import * as http from 'http';

export const app = express();

export const ws = new WebSocketServer({ noServer: true });
const clients = new Map<string, WebSocket>();
const lastMessageMap = new Map<string, string>();
const aggregationService = new AggregationService();

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

ws.on('connection', handleConnection);


function isDuplicated(clientId: string, message: string): boolean {
	if (lastMessageMap.get(clientId) === message) {
		return true; // It's a duplicate message
	}

	lastMessageMap.set(clientId, message);
	return false;
}

async function handleConnection(ws: WebSocket, request: http.IncomingMessage) {
	const clientId = new URL(request.url!, `http://${request.headers.host}`).searchParams.get('clientId');
	
	if (!clientId) {
	  ws.close();
	  return;
	}
	
	logger.info(`WebSocket connection established for client: ${clientId}`);
	ws.send(`Welcome, Client ${clientId}!`);
	
	clients.set(clientId, ws);
	
	ws.on('message', await createMessageHandler(ws, clientId));
	
	ws.on('close', () => {
	  clients.delete(clientId);
	  logger.info(`WebSocket connection closed for client: ${clientId}`);
	});
}

// Message handler factory
async function createMessageHandler(ws: WebSocket, clientId: string) : Promise<(message: WebSocket.Data) => void> {
	return async (message: WebSocket.Data) => {
		const messageStr = message.toString();

		if (isDuplicated(clientId, messageStr)) {
			return;
		}

		try {
			const data = JSON.parse(messageStr);

			switch (data.type) {
				case 'CPU_USAGE':
					await handleCpuUsage(ws, clientId, data.payload);
					break;

				case 'BACKGROUND_CPU_USAGE':
					// await handleCpuUsage(ws, clientId, data.payload);
					logger.info(`Client ${clientId} sent background CPU usage: ${data.payload}`);
					break;

				case 'NETWORK_DATA':
					handleNetworkData(ws, clientId, data.payload);
					break;

				case 'PREPARE_TO_CLOSE':
					await handlePrepareToClose(ws, clientId);
					break;

				default:
					ws.send(`Unknown message type: ${data.type}`);
			}
		} catch (error: any) {
			logger.warn(`Client ${clientId} sent plain text: "${messageStr}"`);
			ws.send(`Received Text: "${messageStr}"`);
		}
	};
}

async function handleCpuUsage(ws: WebSocket, clientId: string, payload: any) {
	await aggregationService.processAggregatedData(payload);
	ws.send(`Received CPU Usage: ${payload.tabInfo.pid} - ${payload.cpuUsage} - ${payload.tabInfo.title}`);
}

// Handle network data
async function handleNetworkData(ws: WebSocket, clientId: string, payload: any) {
	logger.info(util.inspect(`Client ${clientId} sent network usage: ${payload}`));
	await aggregationService.processNetworkData(payload);
	// ws.send(JSON.stringify({ type: 'NETWORK_DATA', data: payload }));
	ws.send(`Received Network Data: ${payload.tabId} - ${payload.networkTransferMetrics}`);
}

function mapToObject(map: Map<any, any>) {
	const obj: Record<string, any> = {};
	for (const [key, value] of map.entries()) {
	  if (value instanceof Map) {
		obj[key] = mapToObject(value); // Handle nested maps
	  } else {
		obj[key] = value;
	  }
	}
	return obj;
  }
  
async function handlePrepareToClose(ws: WebSocket, clientId: string) {
	ws.send('Sending aggregated data to client...');

	const aggregatedData = await aggregationService.getAggregatedDataOfEachTab();
	const co2Emissions = await aggregationService.convertCPUTimeToCO2Emissions();

	ws.send(JSON.stringify({
		'AGGREGATED_CPU_USAGE' : {
			// payload: util.inspect(aggregatedData, { showHidden: false, depth: null })
			payload: mapToObject(aggregatedData)
		},
		'CO2_EMISSIONS' : {
			// payload: util.inspect(co2Emissions, { showHidden: false, depth: null })
			payload: mapToObject(co2Emissions)
		}
	}));

	ws.send('Closing WebSocket connection...');
	ws.close();

	if (clientId) {
		clients.delete(clientId);
	}

	aggregationService.clearData();
}