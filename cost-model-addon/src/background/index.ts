import * as messageHandler from "./handlers/message-handlers";
import { TrackingState } from "./state/tracking-state";
import { MessageType } from "./types/message.types";
import { WebSocketService } from "./services/client-websocket";



(async () => {
  const contentHandler = new messageHandler.ContentMessageHandler();
  const trackingHandler = new messageHandler.TrackingMessageHandler();
  const wsService = WebSocketService.getInstance("extension-client");

  /**
   *  Handle message from the sidebar to toggle tracking. 
   *  Tracking handler will handle the message and update the tracking state.
   *  If tracking is enabled, connect to the websocket server and vice versa.
   */

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => { 

    if (message.type === MessageType.TOGGLE_TRACKING && message.from === "sidebar") {
      trackingHandler.handleMessage(message, sender, sendResponse);
      trackingHandler.sendTrackingStateToActiveTab();
    }
  });

  browser.runtime.onConnect.addListener((port) => {
    if (port.name === "content-script") {
      const tabId = port.sender?.tab?.id;
      if (tabId !== undefined) {
        trackingHandler.registerPort(tabId, port);
      } else {
        console.warn("Port connected without a tab ID");
      }

      port.onMessage.addListener(async (message: any) => {
        if (message.type === MessageType.CLICK_EVENT || message.type === MessageType.SCROLL_EVENT) {
          contentHandler.handleMessage(message, port.sender, (response) => {
            port.postMessage(response);
          });
          // wsService.sendMessage(message);
        }
      });

      port.onDisconnect.addListener(() => {
        if (tabId !== undefined) {
          trackingHandler.unregisterPort(tabId);
        }
      });
    }
  });

  // // On tab update complete, send the tracking state to the tab.
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) { 
      trackingHandler.sendTrackingStateToActiveTab();
    }
  });

  browser.tabs.onActivated.addListener(() => {
    if (trackingHandler.getTrackingState()) {
      trackingHandler.sendTrackingStateToActiveTab();
    }
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