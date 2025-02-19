import { ContentMessageHandler } from './handlers/content-handler';
import { TrackingMessageHandler } from './handlers/tracking-handler';
import { WebSocketService } from './services/client-websocket';
import { PortManager } from './port-manager';
import { MessageType } from '../common/message.types';
import { getActiveTab } from './services/tab-services';

// Initialize services and handlers
const contentHandler = new ContentMessageHandler();
const trackingHandler = new TrackingMessageHandler();
const wsService = WebSocketService.getInstance("extension-client");
const portManager = PortManager.getInstance();

// Handle connection from content scripts
const handleContentConnect = (port: browser.runtime.Port): void => {

  const tabId = port.sender?.tab?.id;
  if (!tabId) return;

  portManager.registerPort(tabId, port);
  port.onMessage.addListener((message: any) => {
    console.log("Received message from content script:", message);
    if (message.type === MessageType.REGISTER) {
      console.log("Content script registered:", message.payload);
      return;
    }
    contentHandler.handleMessage(message, port, (response) => {
      port.postMessage(response);
    });
  });
};

const handleDevtoolsConnect = (port: browser.runtime.Port): void => {
  portManager.registerPort(-999, port);
  port.onMessage.addListener((message: any) => {
    if (message.type === MessageType.REGISTER) {
      console.log("Devtools registered:", message.payload);
      return;
    } else if (message.action == "getHAR") {
      console.log("HAR:", message.har);
      return;
    } 
  });
};

// Handle messages from the extension
const handleMessage = async (
  message: any, 
  sender: any, 
  sendResponse: (response?: any) => void
): Promise<void> => {
  if (message.type === MessageType.TOGGLE_TRACKING && message.from === "sidebar") {
    trackingHandler.handleMessage(message, sender, sendResponse);
    const activeTab = await getActiveTab();
    if (activeTab) {
      const port = portManager.getPort(activeTab.id!);
      if (port) {
        trackingHandler.sendToActiveTab(port);
      }
    }
    portManager.getPort(-999)?.postMessage({ action: "getHAR" });
  }
};

// Handle tab updates
const handleTabUpdate = (
  tabId: number, 
  changeInfo: browser.tabs._OnUpdatedChangeInfo, 
  tab: browser.tabs.Tab
): void => {
  if (changeInfo.status === "complete" && tab.url) {
    trackingHandler.sendToTab(tabId, port); // ** Need further investigation ** //
  }
};

// Set up event listeners
(() => {
  // Connection listeners
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === "content") {
      handleContentConnect(port);
    } 

    else if (port.name === "devtools") {
      handleDevtoolsConnect(port);
    }
  });

  // Message listeners
  browser.runtime.onMessage.addListener(handleMessage);

  // Tab listeners
  browser.tabs.onUpdated.addListener(handleTabUpdate);
  browser.tabs.onActivated.addListener((tab) => {
      const port = portManager.getPort(tab.tabId);
      if (port) {
          trackingHandler.sendToActiveTab(port);
      }
    });
  // Extension listeners
  browser.runtime.onSuspend.addListener(() => {
    wsService.disconnect();
  });

  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });

  browser.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated!");
  });
})();