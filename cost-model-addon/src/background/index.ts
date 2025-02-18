import { ContentMessageHandler } from './handlers/content-handler';
import { TrackingMessageHandler } from './handlers/tracking-handler';
import { WebSocketService } from './services/client-websocket';
import { PortManager } from './port-manager';
import { MessageType } from '../common/message.types';

// Initialize services and handlers
const contentHandler = new ContentMessageHandler();
const trackingHandler = new TrackingMessageHandler();
const wsService = WebSocketService.getInstance("extension-client");
const portManager = PortManager.getInstance();

// Handle connection from content scripts
const handleConnect = (port: browser.runtime.Port): void => {
  if (port.name !== "content-script") return;

  const tabId = port.sender?.tab?.id;
  if (!tabId) return;

  portManager.registerPort(tabId, port);
  port.onMessage.addListener((message: any) => {
    if (message.type === MessageType.REGISTER) {
      console.log("Content script registered:", message.payload);
      return;
    }
    contentHandler.handleMessage(message, port.sender, (response) => {
      port.postMessage(response);
    });
  });
};

// Handle messages from the extension
const handleMessage = (
  message: any, 
  sender: any, 
  sendResponse: (response?: any) => void
): void => {
  if (message.type === MessageType.TOGGLE_TRACKING && message.from === "sidebar") {
    trackingHandler.handleMessage(message, sender, sendResponse);
    trackingHandler.sendToActiveTab(portManager);
  }
};

// Handle tab updates
const handleTabUpdate = (
  tabId: number, 
  changeInfo: browser.tabs._OnUpdatedChangeInfo, 
  tab: browser.tabs.Tab
): void => {
  if (changeInfo.status === "complete" && tab.url) {
    trackingHandler.sendToTab(tabId, portManager);
  }
};

// Set up event listeners
(() => {
  // Connection listeners
  browser.runtime.onConnect.addListener(handleConnect);

  // Message listeners
  browser.runtime.onMessage.addListener(handleMessage);

  // Tab listeners
  browser.tabs.onUpdated.addListener(handleTabUpdate);
  browser.tabs.onActivated.addListener(() => {
    trackingHandler.sendToActiveTab(portManager);
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