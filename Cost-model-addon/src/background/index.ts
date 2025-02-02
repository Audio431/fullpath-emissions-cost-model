import * as messageHandler from "./services/messaging/message-handlers";
import { TrackingState } from "./state/tracking-state";
import { MessageType } from "./services/messaging/message.type";


(async () => {
  const trackingStateInstance = TrackingState.getInstance();
  const contentHandler = new messageHandler.ContentMessageHandler();
  const trackingHandler = new messageHandler.TrackingMessageHandler(trackingStateInstance);

  browser.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated!");
  });
  
  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });
  
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === MessageType.CLICK_EVENT || message.type === MessageType.SCROLL_EVENT) {
      contentHandler.handleMessage(message, sender, sendResponse);
    } else if (message.type === MessageType.TOGGLE_TRACKING) {
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
})();