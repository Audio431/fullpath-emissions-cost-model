import { TrackingMessage } from '../types/message.types';

export abstract class BaseMessageHandler {
  abstract handleMessage(
    message: TrackingMessage, 
    sender: any, 
    sendResponse: (response?: any) => void
  ): void;

  protected handleUnknownMessage(type: string, sendResponse: (response?: any) => void): void {
    console.warn(`Unknown message type: ${type}`);
    sendResponse({ error: "Unknown message type" });
  }
}