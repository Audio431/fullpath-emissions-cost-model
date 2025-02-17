import { ContentTrackingHandler } from "./tracking-handler";

const contentTrackingHandler = new ContentTrackingHandler();


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRACKING_STATE" && message.from === "background") {
    console.log("Received message from background script", message);
    if (message.payload) {
      contentTrackingHandler.enableTracking();
      sendResponse({ type: "TRACKING_STATE", payload: "Establish port connection", from: "content" });
    } else { 
      contentTrackingHandler.disableTracking();
      sendResponse({ type: "TRACKING_STATE", payload: "Disable port connection", from: "content" });
    }
  }
});