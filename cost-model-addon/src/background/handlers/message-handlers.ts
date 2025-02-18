import { MessageType, TrackingMessage } from '../types/message.types';
import { TrackingState } from '../state/tracking-state';
import { PortManager } from '../index';

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

  constructor() {
    super();
    this.TrackingState = TrackingState.getInstance();
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

  async sendToActiveTab(ports: PortManager): Promise<void> {
    try {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs.length === 0 || !tabs[0].id) return;
        const activeTabId = tabs[0].id;
        const port = ports.getPort(activeTabId);
        if (port) {
          port.postMessage({
            type: "TRACKING_STATE",
            payload: this.getTrackingState(),
            from: "background",
          });
          console.log(`Sent state to active tab ${activeTabId} url: ${tabs[0].url}`);
        } else {
          console.log(`No registered port for active tab ${activeTabId}`);
        }
      });
    }
    catch (error) {
      console.error("Error sending tracking state to active tab:", error);
    }
  }
}