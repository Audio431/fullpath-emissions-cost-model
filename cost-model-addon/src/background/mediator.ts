import { MessagingService } from './services';
import { SidebarComponent, DevToolsComponent, ContentComponent, BaseComponent } from './modules';
import { getActiveTab } from './services';
import { MessageType, Action } from '../common/message.types';
import { WebSocketService } from './services';
import { MonitorCpuUsageController, monitorCpuUsageActive } from './services';

export interface IMediator {
    notify(sender: any, event: RuntimeMessage): void;
}

export class BackgroundMediator implements IMediator {
    private static instance: BackgroundMediator;

    private messagingService: MessagingService;
    private websocketService: WebSocketService;

    private sidebarComponent: SidebarComponent;
    private devtoolsComponent: DevToolsComponent;
    private contentComponent: ContentComponent;

    private cpuMonitor: MonitorCpuUsageController | null = null;

    private isTracking: boolean = false;

    private constructor() {
        this.messagingService = MessagingService.getInstance();
        this.websocketService = WebSocketService.getInstance();

        this.sidebarComponent = SidebarComponent.getInstance();
        this.sidebarComponent.setMediator(this);

        this.devtoolsComponent = DevToolsComponent.getInstance();
        this.devtoolsComponent.setMediator(this);

        this.contentComponent = ContentComponent.getInstance();
        this.contentComponent.setMediator(this);

        this.messagingService.setMessageHandler(this.handleIncomingMessage.bind(this));
        this.messagingService.setPortMessageHandler(this.handlePortMessage.bind(this));
        this.messagingService.setOnUpdateListener(this.handleOnTabUpdate.bind(this));
        this.messagingService.setOnActiveTabUpdateListener(this.handleOnTabUpdate.bind(this));

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
    private handleIncomingMessage(message: RuntimeMessage, sender: any): void {
        switch (message.from) {

            case 'sidebar':
                if (message.type === MessageType.TOGGLE_TRACKING) {
                    this.sidebarComponent.userToggledTracking();
                }
                break;

            case 'content':
                if (message.type === MessageType.TRACKING_STATE) {
                    //   this.contentComponent.updateTrackingState(message.payload.state);
                }
                break;

            case 'devtools':
                // handle devtools messages
                break;
        }
    }

    private handlePortMessage(message: any, port: browser.runtime.Port): void {
        switch (port.name) {
            case 'content-script':
                if (message.type === MessageType.EVENT_LISTENER) {
                    switch (message.payload.event) {
                        case Action.CLICK_EVENT:
                            this.contentComponent.onClicked(message)
                            dispatchEvent(new CustomEvent('click-event', {}));
                            console.log('Received click event:', message.payload.elementDetails);
                            break;
                        case Action.SCROLL_EVENT:
                            console.log('Received scroll event:', message.payload.scrollY);
                            break;
                    }
                };
                break;

            case 'devtools':
                // console.log('Received message from devtools:');


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

    public notify(sender: BaseComponent, event: RuntimeMessage): void {
        if (sender instanceof SidebarComponent) {
            this.handleSidebarEvent(event);
        } else if (sender instanceof ContentComponent) {
            this.handleContentEvent(event);
        } else if (sender instanceof DevToolsComponent) {
            this.handleDevtoolsEvent(event);
        }
    }

    private async handleSidebarEvent(event: RuntimeMessage): Promise<void> {
        try {
            switch (event.type) {
                case MessageType.TOGGLE_TRACKING:
                    this.handleToggleTrackingEvent(event);
                    break;
            }
        } catch (error) {
            console.error('Error handling sidebar event:', error);
        }
    }

    private async handleContentEvent(event: RuntimeMessage) {
        switch (event.type) {
            case MessageType.CPU_USAGE:
                const activeTab = await getActiveTab();

                // console.log(fluentname, url, ':', cpuinfo);
                break;
        }
    }

    private async handleDevtoolsEvent(event: RuntimeMessage) {
        switch (event.type) {
            case MessageType.CPU_USAGE:
                // handle CPU usage request from devtools
                break;
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