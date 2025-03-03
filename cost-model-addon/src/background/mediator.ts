import { MessagingService } from './services';
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



    private constructor() {
        this.messagingService = MessagingService.getInstance();
        this.websocketService = WebSocketService.getInstance();

        this.messagingService.setMessageHandler(this.processExternalMessage.bind(this));
        this.messagingService.setPortMessageHandler(this.processPortMessage.bind(this));
        this.messagingService.setOnUpdateListener(this.handleOnTabUpdate.bind(this));
        this.messagingService.setOnActiveTabUpdateListener(this.handleOnTabUpdate.bind(this));

        eventBus.on("SIDEBAR_TOGGLE_TRACKING", this.handleToggleTrackingEvent.bind(this));

    }

    public static getInstance(): BackgroundMediator {
        if (!BackgroundMediator.instance) {
            BackgroundMediator.instance = new BackgroundMediator();
        }
        return BackgroundMediator.instance;
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
                if (message.type === MessageType.EVENT_LISTENER) {
                    switch (message.payload.event) {
                        case Action.CLICK_EVENT:
                            eventBus.publish("CONTENT_CLICK_EVENT", {
                                elementDetails: message.payload.elementDetails,
                                // add any other data you need
                            });

                            break;
                        case Action.SCROLL_EVENT:
                            console.log('Received scroll event:', message.payload.scrollY);
                            break;
                    }
                };
                break;

            case 'devtools':
                console.log('Received message from devtools:');
                // console.log('Received message from devtools:', message);
                break;
        }
    }

    private async handleOnTabUpdate(tabId: number, tab: browser.tabs.Tab): Promise<void> {
        if (this.isTracking) {
            await this.messagingService.sendToTab(tabId, {
                type: MessageType.TRACKING_STATE,
                from: 'background',
                payload: { state: this.isTracking }
            }, tab);

            const activeTab = await getActiveTab();

            console.log("SuccesorId: ", activeTab?.successorTabId);
        }
    }

    private async handleToggleTrackingEvent(event: RuntimeMessage) {
        this.isTracking = event.payload.enabled;

        const activeTab = await getActiveTab();
        if (activeTab?.id) {
            await this.messagingService.sendToTab(activeTab.id, {
                type: MessageType.TRACKING_STATE,
                from: 'background',
                payload: { state: this.isTracking }
            }, activeTab);
        }

        this.toggleTrackingListeners(this.isTracking);
    }

    private cpuSpikeListener = (event: Event) => {
        const customEvent = event as CustomEvent<{ cpuUsage: number; activeTab: string }>;
        this.websocketService.sendMessage({
            type: MessageType.CPU_USAGE,
            payload: customEvent.detail
        });
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