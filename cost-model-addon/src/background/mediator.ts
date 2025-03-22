import { getActiveTabId, MessagingService } from './services';
import { getActiveTab } from './services';
import { MessageType, Action } from '../common/message.types';
import { WebSocketService } from './services';
import { MonitorCpuUsageController, monitorCpuUsageActive } from './services';
import { eventBus } from './shared/eventBus';

export class BackgroundMediator {
    private static instance: BackgroundMediator;

    private messagingService: MessagingService;
    private websocketService: WebSocketService;

    private cpuMonitor: MonitorCpuUsageController | null = null;

    private portConnections: Map<number, Record<string, browser.runtime.Port>> = new Map();

    private constructor() {
        this.messagingService = MessagingService.getInstance();
        this.websocketService = WebSocketService.getInstance();

        this.messagingService.setMessageHandler(this.processExternalMessage.bind(this));
        this.messagingService.setPortMessageHandler(this.processPortMessage.bind(this));
        this.messagingService.setPortConnectionHandler(this.handlePortConnection.bind(this));
        this.messagingService.setPortDisconnectionHandler(this.handlePortDisconnection.bind(this));
        this.messagingService.setOnUpdateListener(this.handleOnTabUpdate.bind(this));
        this.messagingService.setOnActiveTabUpdateListener(this.handleOnTabUpdate.bind(this));

        eventBus.on("RESPONSE_TOGGLE", this.handleToggleTracking.bind(this));
        eventBus.on("DEVTOOLS_SEND_TO_WEBSOCKET", this.handleDevtoolsPortMessage.bind(this));
    }

    public static getInstance(): BackgroundMediator {
        if (!BackgroundMediator.instance) {
            BackgroundMediator.instance = new BackgroundMediator();
        }
        return BackgroundMediator.instance;
    }
 
    /* Establishes the connection between the scripst and the background */

    // Handle incoming runtime messages from content scripts, devtools, and sidebar
    private async processExternalMessage(
        message: RuntimeMessage, 
        sender: any, 
        sendResponse: (response?: any) => void
    ): Promise<void> {
        if (message.from === 'sidebar') {
            switch (message.type) {
                case MessageType.TOGGLE_TRACKING:
                    const [result] = await eventBus.publish("TOGGLE_TRACKING", message.payload.enabled);
                    if (result?.contentNotified && result?.devtoolsNotified && result?.monitorEnabled) {
                        sendResponse({ status: "success", payload: result });
                    } else {
                        sendResponse({ status: "error", payload: result });
                    }
                    break; 
            }
        }
    }

    private async handleToggleTracking(event: RuntimeMessage): Promise<{ contentNotified: boolean, devtoolsNotified: boolean, monitorEnabled: boolean }> {
        // Update the tracking state and get a message to send.
        const trackingMessage = await this.updateTrackingState(event.payload.enabled);
    
        // Send notifications concurrently and await both.
        const [contentNotified , devtoolsNotified, monitorEnabled ] = await Promise.all([
            this.notifyContentScript(trackingMessage),
            this.notifyDevtools(trackingMessage),
            this.toggleTrackingListeners(event.payload.enabled)
        ]);

        return { contentNotified, devtoolsNotified, monitorEnabled };
    }

    /**
     * Shared function that handles the "what it means to set tracking on/off"
     */
    private async updateTrackingState(newState: boolean): Promise<RuntimeMessage> {
        return {
            type: MessageType.TRACKING_STATE,
            from: 'background',
            payload: {
                state: newState
            }
        };
    }
    
    private async notifyContentScript(message: RuntimeMessage): Promise<boolean> {
        try {
            const activeTab = await getActiveTab();
            if (activeTab) {
                await this.messagingService.sendToTab(activeTab, message);
                return true; // Successfully notified content script
            }
            return false; // No active tab found
        } catch (error) {
            console.error("Error in notifyContentScript:", error);
            return false;
        }
    }

    private async notifyDevtools(message: RuntimeMessage): Promise<boolean>{
        try {
            const activeTabId = await getActiveTabId();
            const devtoolsPort = this.portConnections.get(activeTabId!)?.['devtools'];

            // If devtools are open (port is valid)
            if (devtoolsPort) {
                await this.messagingService.sendPortMessage(devtoolsPort, message);
                return true; // Successfully notified devtools
            } else {
                // If devtools are not open, send a notification to Sidebar
                return false;
            }
        } catch (error) {
            console.error("Error:", error);
            return false;
        }
    }

    // Handle incoming port connections from content scripts and devtools
    private handlePortConnection(port: browser.runtime.Port): void {
        console.log(`[BackgroundMediator] Port notification: ${port.name} connected`);
        if (port.name === 'devtools') {
            port.postMessage({ type: "REQUEST_TAB_ID" });
        } else {
            const tabId = port.sender?.tab?.id ?? -1;
            this.portConnections.set(tabId, { 
                ...this.portConnections.get(tabId), 
                [port.name]: port });
        }
    }

    // Handle incoming port disconnections from content scripts and devtools
    private handlePortDisconnection(port: browser.runtime.Port): void {
        const tabId = port.sender?.tab?.id ?? -1;
        this.portConnections.get(tabId) && delete this.portConnections.get(tabId)![port.name];
    }

    // Handle incoming port messages from content scripts and devtools
    private processPortMessage(message: any, port: browser.runtime.Port): void {
        switch (port.name) {
            case 'content-script':
                this.handleContentPortMessage(message, port);
                break;

            case 'devtools':
                this.handleDevtoolsPortMessage(message, port);
                break;
        }
    }

        // Handle content script messages
        private async handleContentPortMessage(message: RuntimeMessage, port: browser.runtime.Port): Promise<void> {
            switch (message.type) {
                case MessageType.EVENT_LISTENER:
                    this.handleContentEvent(message.payload);
                    break;
            }
        }
    
        /**
         * Process the message and sends it to the appropriate handler.
         * handleContentPortMessage -> handleContentEvent
         */
        private async handleContentEvent (payload: EventPayload<Action>) {
            switch (payload.event) {
                case Action.CLICK_EVENT:
                    // this.messagingService.sendToRuntime({
                    //     type: MessageType.EVENT_LISTENER,
                    //     payload: payload
                    // });
                    break;
    
                case Action.SCROLL_EVENT:
                    // this.messagingService.sendToRuntime({
                    //     type: MessageType.EVENT_LISTENER,
                    //     payload: payload
                    // });
                    break;
            }
        }

    private async handleDevtoolsPortMessage(message: any, port?: browser.runtime.Port): Promise<void> {
        switch (message.type) {
            case MessageType.REQUEST_TRACKING_STATE:
                
                const runtimeMessage: RuntimeMessage = {
                    type: MessageType.TRACKING_STATE,
                    from: 'background',
                    payload: { state: await this.getTrackingState() }
                };
                
                this.messagingService.sendPortMessage(port!, runtimeMessage);
                break;

            case "TAB_ID":
                const tabId = message.tabId;
                this.portConnections.set(tabId, { 'devtools': port! });
                break;
            
            case MessageType.NETWORK_DATA:
                eventBus.publish("DEVTOOLS_MESSAGE", message);
                break;
            
            case "SEND_TO_WEBSOCKET":
                this.websocketService.sendMessage({
                    type: MessageType.NETWORK_DATA,
                    payload: message.payload
                });
                break;
        }
    }


    // Handle tab updates
    private async handleOnTabUpdate(tabId: number, changeInfo: string, tab: browser.tabs.Tab): Promise<void> {
        console.log('[Background] Port connections:', [...this.portConnections]);

        const isTracking = await this.getTrackingState();

        if (isTracking) {
            const activeTab = await getActiveTab();
            const runtimeMessage: RuntimeMessage = {
                type: MessageType.TRACKING_STATE,
                from: 'background',
                payload: { state: isTracking }
            };
            if (activeTab)
                await this.messagingService.sendToTab(activeTab, runtimeMessage);
            else {
                await this.messagingService.sendToTab(tab, runtimeMessage);
            }
        }
    }

    // Get the current tracking state while already binding the event listener
    private async getTrackingState(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // Listen once for the response event from the SidebarModule.
            eventBus.once("RESPONSE_TRACKING_STATE", (message: RuntimeMessage) => {
                if (message && message.payload && typeof message.payload.enabled === 'boolean') {
                    resolve(message.payload.enabled);
                } else {
                    reject(new Error("Invalid tracking state response"));
                }
            });
            // Request the current tracking state.
            eventBus.publish("GET_TRACKING_STATUS");
        });
    }

    /**
     * Toggle system-level watchers based on new tracking state.
     */
    private async toggleTrackingListeners(newState: boolean): Promise<boolean> {
        try {
            if (newState) {
                await this.websocketService.connect("BackgroundMediator");
                this.cpuMonitor = await monitorCpuUsageActive(0);
                window.addEventListener('cpu-spike', this.cpuSpikeListener);
            } else {
                this.websocketService.disconnect();
                if (this.cpuMonitor) {
                    this.cpuMonitor.cancel();
                    this.cpuMonitor = null;
                }
                window.removeEventListener('cpu-spike', this.cpuSpikeListener);
            }
            return true;
        } catch (error) {
            console.error("[Background] Failed to toggle listeners:", error);
            // Cleanup partial setup if needed
            if (newState && this.cpuMonitor) {
                this.cpuMonitor.cancel();
                this.cpuMonitor = null;
            }
            return false;
        }
    }

    private cpuSpikeListener = (event: Event) => {
        const customEvent = event as CustomEvent<{ cpuUsage: number; activeTab: string }>;

        const runtimeMessage: RuntimeMessage = {
            type: MessageType.CPU_USAGE,
            payload: customEvent.detail
        };

        this.websocketService.sendMessage(runtimeMessage);
    };

}