import * as messageHandler from "./handlers/message-handlers";
import { TrackingState } from "./state/tracking-state";
import { MessageType } from "./types/message.types";
import { WebSocketService } from "./services/client-websocket";


(async () => {
  const trackingStateInstance = TrackingState.getInstance();
  const contentHandler = new messageHandler.ContentMessageHandler();
  const trackingHandler = new messageHandler.TrackingMessageHandler(trackingStateInstance);
  const wsService = WebSocketService.getInstance("extension-client");

  await wsService.connect();

  browser.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated!");
  });
  
  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });
  
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // From content script
    if (message.type === MessageType.CLICK_EVENT || message.type === MessageType.SCROLL_EVENT) {
      contentHandler.handleMessage(message, sender, sendResponse);
    }

    // From sidebar
    if (message.type === MessageType.TOGGLE_TRACKING) {
      trackingHandler.handleMessage(message, sender, sendResponse);
    }
  });
  
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      changeInfo.status === "complete" &&
      tab.url &&
      (tab.url.startsWith("http://") || tab.url.startsWith("https://"))
    ) {
      trackingHandler.sendTrackingState(tabId);
    }
  });

  browser.runtime.onSuspend.addListener(() => {
    wsService.disconnect();
  });
})();