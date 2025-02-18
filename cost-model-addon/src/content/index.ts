import { ContentTrackingHandler } from "./tracking-handler";

const contentTrackingHandler = new ContentTrackingHandler();

console.log("Content script loaded.");

// Establish a persistent connection to the background script.
const port = browser.runtime.connect({ name: "content-script" });

// Optionally, send a registration message to notify the background script that the content script is ready.
port.postMessage({
  type: "REGISTER",
  from: "content",
  payload: "Content script ready",
});

// Listen for messages from the background script.
port.onMessage.addListener((message: any) => {
  if (message.type === "TRACKING_STATE" && message.from === "background") {
    if (message.payload) {
      contentTrackingHandler.registerPort(port);
      contentTrackingHandler.enableTracking();
    } else {  
      contentTrackingHandler.unregisterPort();
      contentTrackingHandler.disableTracking();
    }
  }
});

// Optionally, you can also listen for one-off runtime messages if needed:
// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === "TRACKING_STATE" && message.from === "background") {
//     console.log("Received runtime tracking state:", message.payload);
//     sendResponse({ received: true });
//   }
// });


// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === "TRACKING_STATE" && message.from === "background") {
//     console.log("Received message from background script", message);
//     if (message.payload) {
//       contentTrackingHandler.enableTracking();
//       sendResponse({ type: "TRACKING_STATE", payload: "Establish port connection", from: "content" });
//     } else { 
//       contentTrackingHandler.disableTracking();
//       sendResponse({ type: "TRACKING_STATE", payload: "Disable port connection", from: "content" });
//     }
//   }
// });