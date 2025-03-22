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

        eventBus.on("CONTENT_TOGGLE_TRACKING", this.handleContentToggle.bind(this));
        eventBus.on("DEVTOOLS_TOGGLE_TRACKING", this.handleDevtoolsToggle.bind(this));
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
    private processExternalMessage(message: RuntimeMessage, sender: any): void {
        if (message.from === 'sidebar') {
            switch (message.type) {
                case MessageType.TOGGLE_TRACKING:
                    eventBus.publish("TOGGLE_TRACKING", message.payload);
            }
        }
    }

    /**
     * Handles toggle tracking events from the EventBus.
     * Dispatches the updated tracking status to connected clients (e.g., devtools or content script).
     */
    private async handleDevtoolsToggle(event: RuntimeMessage) {
        const trackingMessage = await this.updateTrackingState(event.payload.enabled);
        await this.notifyDevtools(trackingMessage);
    }

    private async handleContentToggle(event: RuntimeMessage) {
        const trackingMessage = await this.updateTrackingState(event.payload.enabled);
        this.toggleTrackingListeners(event.payload.enabled);
        await this.notifyContentScript(trackingMessage);
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
    
    private async notifyContentScript(message: RuntimeMessage) {
        const activeTab = await getActiveTab();
        if (activeTab) {
            await this.messagingService.sendToTab(activeTab, message);
        }
    }

    private async notifyDevtools(message: RuntimeMessage) {
        try {
            const activeTabId = await getActiveTabId();
            const devtoolsPort = this.portConnections.get(activeTabId!)?.['devtools'];

            // If devtools are open (port is valid)
            if (devtoolsPort) {
                await this.messagingService.sendPortMessage(devtoolsPort, message);
            } else {
                // If devtools are not open, send a notification to Sidebar
                // await this.messagingService.sendToSidebar(message);
            }
        } catch (error) {
            console.error('Devtools may not be open:', error);
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
        console.log('Port connections:', [...this.portConnections]);

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
    private async toggleTrackingListeners(newState: boolean) {
        if (newState) {
            this.websocketService.connect("BackgroundMediator");
            this.cpuMonitor = await monitorCpuUsageActive(0);
            addEventListener('cpu-spike', this.cpuSpikeListener);
        } else {
            this.websocketService.disconnect();

            if (this.cpuMonitor) {
                this.cpuMonitor.cancel();
                this.cpuMonitor = null;
            }

            removeEventListener('cpu-spike', this.cpuSpikeListener);
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