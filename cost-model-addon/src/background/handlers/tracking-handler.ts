import { MessageType, Message } from '../../common/message.types';
import { TrackingState } from '../state/tracking-state';
import { BaseMessageHandler } from './base-handler';
import { PortManager } from '../port-manager';
import { TabService } from '../services/tab-services';

export class TrackingMessageHandler extends BaseMessageHandler {
  private trackingState: TrackingState;
  private tabService: TabService;

  constructor() {
    super();
    this.trackingState = TrackingState.getInstance();
    this.tabService = new TabService();
  }

  getTrackingState(): boolean {
    return this.trackingState.isTrackingActive();
  }

  handleMessage(
    message: Message, 
    sender: any, 
    sendResponse: (response?: any) => void
  ): void {
    if (message.type === MessageType.TOGGLE_TRACKING) {
      this.toggleTracking();
    } else {
      this.handleUnknownMessage(message.type, sendResponse);
    }
  }

  private toggleTracking(): void {
    this.trackingState.isTrackingActive()
      ? this.trackingState.stopTracking()
      : this.trackingState.startTracking();
  }

  async sendToActiveTab(portManager: PortManager): Promise<void> {
    try {
      const activeTab = await this.tabService.getActiveTab();
      if (!activeTab?.id) return;
      
      await this.sendToTab(activeTab.id, portManager);
    } catch (error) {
      console.error("Error sending tracking state to active tab:", error);
    }
  }

  async sendToTab(tabId: number, portManager: PortManager): Promise<void> {
    const port = portManager.getPort(tabId);
    if (!port) {
      console.log(`No registered port for tab ${tabId}`);
      return;
    }

    const message = {
      type: "TRACKING_STATE",
      payload: this.getTrackingState(),
      from: "background"
    };

    port.postMessage(message);
    console.log(`Sent state to tab ${tabId}`);
  }
}
