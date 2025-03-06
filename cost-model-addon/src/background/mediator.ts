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

    private isTracking: boolean = false;

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

        eventBus.on("SIDEBAR_TOGGLE_TRACKING", this.handleContentToggleTrackingEvent.bind(this));
        eventBus.on("DEVTOOLS_TOGGLE_TRACKING", this.handleDevtoolsToggleTrackingEvent.bind(this));
        eventBus.on("DEVTOOLS_SEND_TO_WEBSOCKET", this.handleDevtoolsMessage.bind(this));
    }

    public static getInstance(): BackgroundMediator {
        if (!BackgroundMediator.instance) {
            BackgroundMediator.instance = new BackgroundMediator();
        }
        return BackgroundMediator.instance;
    }

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

    private handlePortDisconnection(port: browser.runtime.Port): void {
        const tabId = port.sender?.tab?.id ?? -1;
        this.portConnections.get(tabId) && delete this.portConnections.get(tabId)![port.name];
    }

    /**
     * Handle incoming runtime messages from content scripts, devtools, and sidebar
     * @param message @type RuntimeMessage
     * @param sender @type any
     */
    private processExternalMessage(message: RuntimeMessage, sender: any): void {
        switch (message.type) {
            case MessageType.TOGGLE_TRACKING:
                eventBus.publish("TOGGLE_TRACKING", message.payload);
        }
    }

    private processPortMessage(message: any, port: browser.runtime.Port): void {
        switch (port.name) {
            case 'content-script':
                this.handleContentMessage(message, port);
                break;

            case 'devtools':
                this.handleDevtoolsMessage(message, port);
                break;
        }
    }

    private async handleContentMessage(message: RuntimeMessage, port: browser.runtime.Port): Promise<void> {
        switch (message.type) {
            case MessageType.EVENT_LISTENER:
                this.handleContentEvent(message.payload);
                break;
        }
    }

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

    private async handleDevtoolsMessage(message: any, port?: browser.runtime.Port): Promise<void> {
        switch (message.type) {
            case MessageType.REQUEST_TRACKING_STATE:
                
                const runtimeMessage: RuntimeMessage = {
                    type: MessageType.TRACKING_STATE,
                    from: 'background',
                    payload: { state: this.isTracking }
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

    private async handleOnTabUpdate(tabId: number, changeInfo: string, tab: browser.tabs.Tab): Promise<void> {
        console.log('Port connections:', [...this.portConnections]);
        if (this.isTracking) {
            const activeTab = await getActiveTab();
            const runtimeMessage: RuntimeMessage = {
                type: MessageType.TRACKING_STATE,
                from: 'background',
                payload: { state: this.isTracking }
            };
            if (activeTab)
                await this.messagingService.sendToTab(activeTab, runtimeMessage);
            else {
                await this.messagingService.sendToTab(tab, runtimeMessage);
            }
        }
    }

    private async handleDevtoolsToggleTrackingEvent(event: RuntimeMessage) {
        this.isTracking = event.payload.enabled;

        try {
            const activeTabId = await getActiveTabId();

            const devtoolsPort = this.portConnections.get(activeTabId!)?.['devtools'];

            const runtimeMessage: RuntimeMessage = {
                type: MessageType.TRACKING_STATE,
                from: 'background',
                payload: { state: this.isTracking }
            };

            await this.messagingService.sendPortMessage(devtoolsPort!, runtimeMessage);

        } catch (error) {
            console.error('Devtools may not be open:', error);
        }
    }

    private async handleContentToggleTrackingEvent(event: RuntimeMessage) {
        this.isTracking = event.payload.enabled;

        const runtimeMessage: RuntimeMessage = {
            type: MessageType.TRACKING_STATE,
            from: 'background',
            payload: {
                state: this.isTracking
            }
        };

        const activeTab = await getActiveTab();
        activeTab && await this.messagingService.sendToTab(activeTab, runtimeMessage);

        this.toggleTrackingListeners(this.isTracking);
    }


    private cpuSpikeListener = (event: Event) => {
        const customEvent = event as CustomEvent<{ cpuUsage: number; activeTab: string }>;

        const runtimeMessage: RuntimeMessage = {
            type: MessageType.CPU_USAGE,
            payload: customEvent.detail
        };

        // this.websocketService.sendMessage(runtimeMessage);
    };

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

}