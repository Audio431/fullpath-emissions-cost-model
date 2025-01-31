browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated!");
});

browser.action.onClicked.addListener(() => {
  browser.sidebarAction.open();
});

// Initialize the global tracking state
let isTracking = false;

// Listen for messages from the sidebar/popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_TRACKING") {
    // Toggle the tracking state
    isTracking = !isTracking;
    console.log(`Background: Tracking is now ${isTracking ? "ON" : "OFF"}`);

    // Notify all existing tabs about the new tracking state
    notifyAllTabs(isTracking);
  
    // Optionally, update the sidebar/popup UI if needed
    // sendResponse({ trackingState: isTracking });

    // Return true if you plan to send a response asynchronously
    // Otherwise, no need to return anything
  }

  if (message.type === "TRACKING_STARTED") {
    console.log("Background: Tracking has started.");
  }

  if (message.type === "TRACKING_STOPPED") {
    console.log("Background: Tracking has stopped.");
  }

  if (message.type === "CLICK_EVENT") {
    console.log("Background: Received a click event:", message.payload);
  }
});

// Function to notify all tabs about the current tracking state
interface Message {
  type: string;
  [key: string]: any;
}

interface Tab {
  id?: number;
  url?: string;
}

function notifyAllTabs(state: boolean): void {
  browser.tabs.query({}).then((tabs: Tab[]) => {
    for (let tab of tabs) {
      if (tab.id !== undefined) {
        // Only attempt to send messages to HTTP/HTTPS tabs
        if (tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
          browser.tabs.sendMessage(tab.id, {
            type: "TRACKING_STATE",
            payload: state
          }).catch((error: Error) => {
            // Handle cases where the tab might not have the content script injected
            console.warn(`Background: Could not send message to tab ${tab.id}:`, error);
          });
        }
      }
    }
  });
}

// Listen for tab updates (e.g., navigation) to notify the new context
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
    console.log(`Background: Tab ${tabId} has completed loading.`);

    // Notify the newly loaded tab of the current tracking state
    browser.tabs.sendMessage(tabId, {
      type: "TRACKING_STATE",
      payload: isTracking
    }).catch((error) => {
      console.warn(`Background: Could not send message to tab ${tabId}:`, error);
    });
  }
});
