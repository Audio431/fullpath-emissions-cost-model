import { api } from './api';
import { Message } from '../../common/message.types';

export class WebSocketService {
    private static instance: WebSocketService;
    private static ws: WebSocket | null; 
    private clientId: string;

    private constructor(clientId: string) {
        this.clientId = clientId;
    }

    public static getInstance(clientId: string): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService(clientId);
        }
        return WebSocketService.instance;
    }

    public async connect(): Promise<void> {
        try {
            if (WebSocketService.ws) {
                console.log('WebSocket connection already exists');
                return;
            }

            await api.startProcess(this.clientId);
            
            // WebSocketService.ws = new WebSocket(`ws://localhost:3000/?clientId=${this.clientId}`);
            WebSocketService.ws = new WebSocket(`wss://fullpath-energyemissions-cost-model.onrender.com/?clientId=${this.clientId}`);
            
            WebSocketService.ws.onopen = () => {
                console.log('WebSocket connection established');
                WebSocketService.ws!.send('Hello Server!');
            };

            WebSocketService.ws.onmessage = (event) => {
                console.log('WebSocket message received:', event.data);
            };

            WebSocketService.ws.onclose = () => {
                console.log('WebSocket connection closed');
                WebSocketService.ws = null;
            };
        } catch (error) {
            console.error('Failed to start process:', error);
            throw error;
        }
    }

    public disconnect(): void {
        if (WebSocketService.ws) {
            WebSocketService.ws.close();
            WebSocketService.ws = null;
        }
    }

    public sendMessage(message: Message): void {
        if (WebSocketService.ws?.readyState === WebSocket.OPEN) {
            WebSocketService.ws.send(JSON.stringify(message));
        }
    }
}