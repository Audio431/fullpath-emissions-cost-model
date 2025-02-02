import { MessageType, TrackingMessage } from './types/message.type';
import { TrackingState } from '../state/tracking-state';

export abstract class BaseMessageHandler {
  abstract handleMessage(message: TrackingMessage, sender: any, sendResponse: (response?: any) => void): void;

  protected handleUnknownMessage(type: string, sendResponse: (response?: any) => void): void {
    console.warn(`Unknown message type: ${type}`);
    sendResponse({ error: "Unknown message type" });
  }
}

export class ContentMessageHandler extends BaseMessageHandler {
  handleMessage(message: TrackingMessage, sender: any, sendResponse: (response?: any) => void): void {
    switch (message.type) {
      case MessageType.CLICK_EVENT:
        console.log("Background: Received a click event:", message.payload);
        break;
        
      case MessageType.SCROLL_EVENT:
        console.log("Background: Received a scroll event:", message.payload);
        break;
        
      default:
        this.handleUnknownMessage(message.type, sendResponse);
        break;
    }
  }
}

export class TrackingMessageHandler extends BaseMessageHandler {
  constructor(private TrackingState: TrackingState) {
    super();
    this.TrackingState.onStateChange((state: boolean) => {
      this.broadcastTrackingState(state);
    });
  }

  handleMessage(message: TrackingMessage, sender: any, sendResponse: (response?: any) => void): void {
    switch (message.type) {
      case MessageType.TOGGLE_TRACKING:
        this.TrackingState.isTrackingActive() 
          ? this.TrackingState.stopTracking() 
          : this.TrackingState.startTracking();
        break;
        
      default:
        this.handleUnknownMessage(message.type, sendResponse);
        break;
    }
  }

  private async broadcastTrackingState(state: boolean): Promise<void> {
    try {
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url?.startsWith("http")) {
          await this.sendTrackingState(tab.id, state);
        }
      }
    } catch (error) {
      console.error("Failed to broadcast tracking state:", error);
    }
  }

  async sendTrackingState(tabId: number, state?: boolean): Promise<void> {
    try {
      const TrackingState = state ?? this.TrackingState.isTrackingActive();
      await browser.tabs.sendMessage(tabId, {
        type: MessageType.TRACKING_STATE,
        payload: TrackingState
      });
    } catch (error) {
      console.warn(`Failed to send message to tab ${tabId}:`, error);
    }
  }
}