import { MessagingService } from './services/messaging-service';
import { SidebarComponent, DevToolsComponent, ContentComponent, BaseComponent } from './components';
import { getActiveTab, getOuterWindowID } from './services/tab-service';
import { MessageType, Action } from '../common/message.types';
import { WebSocketService } from './services/client-websocket';
import { handleCPUUsageRequest } from './services/cpu-usage-service';

export interface IMediator {
    notify(sender: any, event: RuntimeMessage): void;
}

export interface IAppState {
    isTracking: boolean;
}

class StateManager {
    private static instance: StateManager;
    private state: IAppState = { isTracking: false };

    private constructor() { }

    public static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }

    public getState(): IAppState {
        return this.state;
    }

    public async setState(partial: Partial<IAppState>): Promise<void> {
        this.state = { ...this.state, ...partial };
        // Optionally persist to browser.storage, if needed
        // await browser.storage.local.set({ state: this.state });
    }
}

export class BackgroundMediator implements IMediator {
    private static instance: BackgroundMediator;

    private messagingService: MessagingService;
    private stateManager: StateManager;
    private websocketService: WebSocketService;

    private sidebarComponent: SidebarComponent;
    private devtoolsComponent: DevToolsComponent;
    private contentComponent: ContentComponent;

    private constructor() {
        this.messagingService = MessagingService.getInstance();
        this.stateManager = StateManager.getInstance();
        this.websocketService = WebSocketService.getInstance("BackgroundMediator");
        
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
     * The Mediator's job: handle inbound messages and route them to the correct "component" or method.
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
                            console.log('Received click event:', message.payload.elementDetails);
                            break;
                        case Action.SCROLL_EVENT:
                            console.log('Received scroll event:', message.payload.scrollY);
                            break;
                    }
                };
                break;

            case 'devtools':
                console.log('Received message from devtools:');
                console.log('Received message from devtools:', message.action);
                break;
        }
    }

    private async handleOnTabUpdate(tabId: number, tab: browser.tabs.Tab): Promise<void> {
        await this.messagingService.sendToTab(tabId, {
            type: MessageType.TRACKING_STATE,
            from: 'background',
            payload: { state: this.stateManager.getState().isTracking }
        }, tab);
    }

    // Example notify pattern:
    public notify(sender: BaseComponent, event: RuntimeMessage): void {
        if (sender instanceof SidebarComponent) {
            this.handleSidebarEvent(event);
        } else if (sender instanceof ContentComponent) {
            this.handleContentEvent(event);
        } else if (sender instanceof DevToolsComponent) {
            // handle devtools event
        }
    }

    private async handleSidebarEvent(event: RuntimeMessage): Promise<void> {
        try {
            switch (event.type) {
                case MessageType.TOGGLE_TRACKING:
                    const newState = !this.stateManager.getState().isTracking;
                    await this.stateManager.setState({ isTracking: newState });

                    const activeTab = await getActiveTab()!;
                    await this.messagingService.sendToTab(activeTab?.id!, {
                        type: MessageType.TRACKING_STATE,
                        from: 'background',
                        payload: { state: newState }
                    }, activeTab!);

                    if (newState) {
                        this.websocketService.connect();
                    } else {
                        this.websocketService.disconnect();
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling sidebar event:', error);
        }
    }

    private async handleContentEvent(event: RuntimeMessage) {
        switch (event.type) {
            case MessageType.CPU_USAGE_REQUEST:
                
                const cpuinfo = await handleCPUUsageRequest();
                
                const activeTab = await getActiveTab();
                activeTab && console.log('Tab CPU Usage:', activeTab.url);

                const test = getOuterWindowID();
                console.log('Outer Window ID:', test);
                (await getOuterWindowID()).forEach( async (value, key) => {
                    console.log('Outer Window ID:', key, value);
                }); 

                this.contentComponent.onCPUUsageResponse(cpuinfo);

                // this.websocketService.sendMessage({ type: MessageType.CPU_USAGE_RESPONSE, payload: cpuinfo });
                // await this.messagingService.sendToContent(event, { type: MessageType.CPU_USAGE_RESPONSE, payload: cpuinfo });
                break;
        }
    }
}
