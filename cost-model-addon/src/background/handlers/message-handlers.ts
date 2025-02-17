import { MessageType, TrackingMessage } from '../types/message.types';
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

  private TrackingState: TrackingState;
  private ports: { [tabId: number]: browser.runtime.Port } = {};


  constructor() {
    super();
    this.TrackingState = TrackingState.getInstance();
  }

  registerPort(tabId: number, port: browser.runtime.Port): void {
    this.ports[tabId] = port;
  }

  unregisterPort(tabId: number): void {
    delete this.ports[tabId];
  }

  public getTrackingState(): boolean {
    return this.TrackingState.isTrackingActive();
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

  async sendTrackingStateToActiveTab(): Promise<void> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0 || !tabs[0].id) {
        console.warn("No active tab found");
        return;
      }
      
      const activeTab = tabs[0];

      if (activeTab.id !== undefined) {
        console.log("activeTab.url", activeTab.url);
        await browser.tabs.sendMessage(activeTab.id, { 
          type: MessageType.TRACKING_STATE, 
          payload: this.getTrackingState(), 
          from: "background" 
        });
      } else {
        console.warn("Active tab ID is undefined");
      }
    } catch (error) {
      console.error("Failed to send tracking state:", error);
    }
  }
}