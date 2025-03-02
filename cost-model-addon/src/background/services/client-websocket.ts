import { MessageType } from '../../common/message.types';
import { api } from './api';

export class WebSocketService {
    private static instance: WebSocketService;
    private static ws: WebSocket | null; 
    private clientId: string = '';

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public async connect(clientId: string): Promise<void> {
        try {
            if (WebSocketService.ws) {
                console.log('WebSocket connection already exists');
                return;
            }

            this.clientId = clientId;
            await api.startProcess(this.clientId);
            
            WebSocketService.ws = new WebSocket(`ws://localhost:3000/?clientId=${this.clientId}`);
            // WebSocketService.ws = new WebSocket(`wss://fullpath-energyemissions-cost-model.onrender.com/?clientId=${this.clientId}`);
            
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
        WebSocketService.ws?.send(JSON.stringify({ type: MessageType.PREPARE_TO_CLOSE, payload: {} }));
    }

    public sendMessage(message: any): void {
        if (WebSocketService.ws?.readyState === WebSocket.OPEN) {
            WebSocketService.ws.send(JSON.stringify(message));
        }
    }
}