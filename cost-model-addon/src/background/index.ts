import * as messageHandler from "./handlers/message-handlers";
import { TrackingState } from "./state/tracking-state";
import { MessageType, TrackingMessage } from "./types/message.types";
import { WebSocketService } from "./services/client-websocket";


export class PortManager {
  private ports: Map<number, browser.runtime.Port> = new Map();

  registerPort(tabId: number, port: browser.runtime.Port): void {
    this.ports.set(tabId, port);
    console.log(`Port for tab ${tabId} registered`);
    port.onDisconnect.addListener(() => {
      this.ports.delete(tabId);
      console.log(`Port for tab ${tabId} disconnected`);
    });
  }

  broadcast(message: any): void {
    this.ports.forEach((port, tabId) => {
      try {
        port.postMessage(message);
      } catch (error) {
        console.warn(`Failed to send message to tab ${tabId}:`, error);
      }
    });
  }

  getPort(tabId: number): browser.runtime.Port | undefined {
    return this.ports.get(tabId);
  }
}


(async () => {
  const contentHandler = new messageHandler.ContentMessageHandler();
  const trackingHandler = new messageHandler.TrackingMessageHandler();
  const wsService = WebSocketService.getInstance("extension-client");
  const portManager = new PortManager();

  
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === "content-script") {

      const tabId = port.sender?.tab?.id;
      
      portManager.registerPort(tabId!, port);

      port.onMessage.addListener((message: any) => {
        contentHandler.handleMessage(message, port.sender, (response) => {
          port.postMessage(response);
        })
      });
    }
  });


  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { 
    if (message.type === MessageType.TOGGLE_TRACKING && message.from === "sidebar") {
      trackingHandler.handleMessage(message, sender, sendResponse);
      console.log("state toggled: ", trackingHandler.getTrackingState());
      trackingHandler.sendToActiveTab(portManager);
    }
  });


  // On tab update complete, send the tracking state to the tab.
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
    // If a port exists for this tab, send the current tracking state
    const port = portManager['ports'].get(tabId); // Accessing the map
    if (port) {
      port.postMessage({
        type: "TRACKING_STATE",
        payload: trackingHandler.getTrackingState(),
        from: "background",
      });
      console.log(`Updated state sent to tab ${tabId} after update.`);
    }
  }
  });

  browser.tabs.onActivated.addListener(() => {
    trackingHandler.sendToActiveTab(portManager);
  });

  browser.runtime.onSuspend.addListener(() => {
    wsService.disconnect();
  });

  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });

  // Listen for installed or updated events
  browser.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated!");
  });

})();